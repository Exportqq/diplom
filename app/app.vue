<template>
  <div class="app">
    <!-- Authentication Forms (центрированы) -->
    <div v-if="!isLoggedIn" class="auth-container">
      <div class="auth-card">
        <div class="auth-header">
          <div class="logo">FinCRM</div>
          <small>финансовая аналитика</small>
        </div>
        <div class="auth-tabs">
          <button :class="['tab', { active: authMode === 'login' }]" @click="authMode = 'login'">Вход</button>
          <button :class="['tab', { active: authMode === 'register' }]" @click="authMode = 'register'">
            Регистрация
          </button>
        </div>

        <!-- Login Form -->
        <form v-if="authMode === 'login'" @submit.prevent="handleLogin">
          <div class="form-group">
            <label>Имя пользователя</label>
            <input type="text" v-model="loginForm.username" required autocomplete="username" />
          </div>
          <div class="form-group">
            <label>Пароль</label>
            <input type="password" v-model="loginForm.password" required autocomplete="current-password" />
          </div>
          <div v-if="authError" class="error-message">{{ authError }}</div>
          <button type="submit" class="btn-primary full-width">Войти</button>
        </form>

        <!-- Register Form -->
        <form v-if="authMode === 'register'" @submit.prevent="handleRegister">
          <div class="form-group">
            <label>Имя пользователя</label>
            <input type="text" v-model="registerForm.username" required autocomplete="username" />
          </div>
          <div class="form-group">
            <label>Пароль</label>
            <input type="password" v-model="registerForm.password" required autocomplete="new-password" />
          </div>
          <div class="form-group">
            <label>Подтвердите пароль</label>
            <input type="password" v-model="registerForm.confirmPassword" required autocomplete="off" />
          </div>
          <div v-if="authError" class="error-message">{{ authError }}</div>
          <button type="submit" class="btn-primary full-width">Зарегистрироваться</button>
        </form>
      </div>
    </div>

    <!-- Main CRM App (only when authenticated) -->
    <template v-else>
      <!-- Sidebar -->
      <aside class="sidebar">
        <div class="logo-area">
          <div class="logo">FinCRM</div>
          <small>финансовая аналитика</small>
        </div>
        <nav>
          <div
            v-for="item in menu"
            :key="item.key"
            class="nav-item"
            :class="{ active: currentPage === item.key }"
            @click="currentPage = item.key"
          >
            <span class="nav-icon">{{ item.icon }}</span>
            <span>{{ item.label }}</span>
          </div>
        </nav>
      </aside>

      <!-- Main Content -->
      <main class="main-content">
        <div class="top-bar">
          <h1 class="page-title">{{ pageTitle }}</h1>
          <div style="display: flex; gap: 12px">
            <button v-if="showAddButton" class="btn-primary" @click="openCreateModal">
              <span class="btn-icon">+</span> Добавить
            </button>
            <button class="btn-secondary" @click="logout">Выйти</button>
          </div>
        </div>

        <!-- Analytics Page -->
        <div v-if="currentPage === 'analytics'">
          <div class="kpi-row">
            <div class="kpi-card">
              <div class="kpi-value">{{ totalRevenue.toLocaleString() }} ₽</div>
              <div>Выручка (успешно закрытые)</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-value">{{ activeDealsSum.toLocaleString() }} ₽</div>
              <div>Активные сделки (потенциал)</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-value">{{ wonDealsCount }} / {{ totalDealsCount }}</div>
              <div>Выиграно / Всего сделок</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-value">{{ conversionRate }}%</div>
              <div>Конверсия в успех</div>
            </div>
          </div>
          <div class="card">
            <h3>📈 Динамика выручки по месяцам</h3>
            <canvas id="revenueChart" style="max-height: 280px"></canvas>
          </div>
          <div class="card">
            <h3>📊 Воронка продаж (сумма сделок по этапам)</h3>
            <canvas id="funnelChart" style="max-height: 280px"></canvas>
          </div>
          <div class="card">
            <h3>🥧 Распределение статусов сделок</h3>
            <canvas id="statusPieChart" style="max-height: 280px"></canvas>
          </div>
        </div>

        <!-- Contacts Page -->
        <div v-if="currentPage === 'contacts'">
          <div class="card">
            <div class="flex-between">
              <input
                type="text"
                class="search-input"
                placeholder="🔍 Поиск по имени, email..."
                v-model="contactSearch"
              />
            </div>
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Имя</th>
                  <th>Email</th>
                  <th>Телефон</th>
                  <th>Компания</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="c in filteredContacts" :key="c.id">
                  <td>{{ c.id }}</td>
                  <td>{{ c.name }}</td>
                  <td>{{ c.email || '—' }}</td>
                  <td>{{ c.phone || '—' }}</td>
                  <td>{{ c.company || '—' }}</td>
                  <td class="action-icons">
                    <span class="icon-btn" title="Редактировать" @click="openContactModal(c)">✏️</span>
                    <span class="icon-btn" title="Удалить" @click="deleteContactConfirm(c.id)">🗑️</span>
                  </td>
                </tr>
                <tr v-if="filteredContacts.length === 0">
                  <td colspan="6">Нет контактов</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Deals Page -->
        <div v-if="currentPage === 'deals'">
          <div class="card">
            <div class="flex-between">
              <select v-model="dealStatusFilter" class="search-input" style="width: auto">
                <option value="all">Все статусы</option>
                <option>Новый</option>
                <option>В работе</option>
                <option>Согласование</option>
                <option>Успешно закрыта</option>
                <option>Закрыта без успеха</option>
              </select>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Название</th>
                  <th>Сумма (₽)</th>
                  <th>Контакт</th>
                  <th>Статус</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="d in filteredDeals" :key="d.id">
                  <td>{{ d.name }}</td>
                  <td>{{ (d.price || 0).toLocaleString() }}</td>
                  <td>{{ getContactName(d.contact_id) }}</td>
                  <td>
                    <select
                      :class="'badge-select status-' + getStatusClass(d.status)"
                      v-model="d.status"
                      @change="updateDealStatus(d)"
                    >
                      <option>Новый</option>
                      <option>В работе</option>
                      <option>Согласование</option>
                      <option>Успешно закрыта</option>
                      <option>Закрыта без успеха</option>
                    </select>
                  </td>
                  <td class="action-icons">
                    <span class="icon-btn" title="Редактировать" @click="openDealModal(d)">✏️</span>
                    <span class="icon-btn" title="Удалить" @click="deleteDealConfirm(d.id)">🗑️</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Tasks Page -->
        <div v-if="currentPage === 'tasks'">
          <div class="card">
            <div class="flex-between">
              <h3>Задачи</h3>
              <button class="btn-primary" @click="openTaskModal()"><span class="btn-icon">+</span> Новая задача</button>
            </div>
            <input
              type="text"
              class="search-input"
              placeholder="🔍 Поиск задач..."
              v-model="taskSearch"
              style="margin-bottom: 16px"
            />
            <table>
              <thead>
                <tr>
                  <th>Название</th>
                  <th>Дедлайн</th>
                  <th>Статус</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="t in filteredTasks" :key="t.id">
                  <td>{{ t.title }}</td>
                  <td>{{ t.due_date || '—' }}</td>
                  <td>
                    <span :class="'badge ' + (t.completed ? 'task-done' : 'task-pending')">
                      {{ t.completed ? 'Выполнена' : 'В работе' }}
                    </span>
                  </td>
                  <td class="action-icons">
                    <span class="icon-btn" title="Редактировать" @click="openTaskModal(t)">✏️</span>
                    <span v-if="!t.completed" class="icon-btn" title="Завершить" @click="toggleTask(t.id)">✅</span>
                    <span class="icon-btn" title="Удалить" @click="deleteTaskConfirm(t.id)">🗑️</span>
                  </td>
                </tr>
                <tr v-if="filteredTasks.length === 0">
                  <td colspan="4">Нет задач. Создайте первую!</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <!-- Modals -->
      <div v-if="modalContact" class="modal-mask" @click.self="modalContact = false">
        <div class="modal-container">
          <h3>{{ editContactId ? 'Редактировать контакт' : 'Новый контакт' }}</h3>
          <div class="form-group"><label>Имя *</label><input v-model="contactForm.name" /></div>
          <div class="form-group"><label>Email</label><input v-model="contactForm.email" /></div>
          <div class="form-group"><label>Телефон</label><input v-model="contactForm.phone" /></div>
          <div class="form-group"><label>Компания</label><input v-model="contactForm.company" /></div>
          <div class="flex-between" style="margin-top: 20px">
            <button class="btn-secondary" @click="modalContact = false">Отмена</button>
            <button class="btn-primary" @click="saveContact">Сохранить</button>
          </div>
        </div>
      </div>

      <div v-if="modalDeal" class="modal-mask" @click.self="modalDeal = false">
        <div class="modal-container">
          <h3>{{ editDealId ? 'Редактировать сделку' : 'Новая сделка' }}</h3>
          <div class="form-group"><label>Название *</label><input v-model="dealForm.name" /></div>
          <div class="form-group"><label>Сумма (₽)</label><input type="number" v-model.number="dealForm.price" /></div>
          <div class="form-group">
            <label>Контакт (ID)</label><input type="number" v-model.number="dealForm.contact_id" />
          </div>
          <div class="form-group">
            <label>Статус</label>
            <select v-model="dealForm.status">
              <option>Новый</option>
              <option>В работе</option>
              <option>Согласование</option>
              <option>Успешно закрыта</option>
              <option>Закрыта без успеха</option>
            </select>
          </div>
          <div class="flex-between">
            <button class="btn-secondary" @click="modalDeal = false">Отмена</button>
            <button class="btn-primary" @click="saveDeal">Сохранить</button>
          </div>
        </div>
      </div>

      <div v-if="modalTask" class="modal-mask" @click.self="modalTask = false">
        <div class="modal-container">
          <h3>{{ editTaskId ? 'Редактировать задачу' : 'Новая задача' }}</h3>
          <div class="form-group"><label>Название *</label><input v-model="taskForm.title" /></div>
          <div class="form-group"><label>Дедлайн</label><input type="date" v-model="taskForm.due_date" /></div>
          <div class="flex-between">
            <button class="btn-secondary" @click="modalTask = false">Отмена</button>
            <button class="btn-primary" @click="saveTask">Сохранить</button>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script>
import Chart from 'chart.js/auto';
import Dexie from 'dexie';
import { computed, onMounted, reactive, ref, watch } from 'vue';

// Инициализация IndexedDB (версия 2 с таблицей users)
const db = new Dexie('FinCRMDB');
db.version(2).stores({
  contacts: '++id, name, email, phone, company',
  deals: '++id, name, price, contact_id, status, createdAt',
  tasks: '++id, title, due_date, completed',
  users: '++id, username, password',
});

// Глобальные реактивные данные
const state = reactive({
  contacts: [],
  deals: [],
  tasks: [],
});

// ------ Вспомогательные функции для работы с БД ------
async function loadAll() {
  try {
    state.contacts = await db.contacts.toArray();
    state.deals = await db.deals.toArray();
    state.tasks = await db.tasks.toArray();
  } catch (e) {
    console.error('Ошибка загрузки данных:', e);
    alert('Не удалось загрузить данные. Обновите страницу.');
  }
}

// Функции для контактов
// ИСПРАВЛЕНИЕ: убираем id перед вставкой, чтобы избежать конфликта ключей
async function addContact(contact) {
  const { id, ...data } = contact;
  await db.contacts.add(data);
  await loadAll();
}
async function updateContact(id, data) {
  const { id: _id, ...cleanData } = data;
  await db.contacts.update(id, cleanData);
  await loadAll();
}
async function deleteContact(id) {
  await db.contacts.delete(id);
  await loadAll();
}

// Функции для сделок
async function addDeal(deal) {
  const { id, ...data } = deal;
  await db.deals.add({ ...data, createdAt: new Date().toISOString() });
  await loadAll();
}
async function updateDeal(id, data) {
  const { id: _id, ...cleanData } = data;
  await db.deals.update(id, cleanData);
  await loadAll();
}
async function deleteDeal(id) {
  await db.deals.delete(id);
  await loadAll();
}

// Функции для задач
async function addTask(task) {
  const { id, ...data } = task;
  await db.tasks.add({ ...data, completed: false });
  await loadAll();
}
async function updateTask(id, data) {
  const { id: _id, ...cleanData } = data;
  await db.tasks.update(id, cleanData);
  await loadAll();
}
async function deleteTask(id) {
  await db.tasks.delete(id);
  await loadAll();
}
async function toggleTask(id) {
  const task = state.tasks.find((t) => t.id === id);
  if (task) await updateTask(id, { completed: !task.completed });
}

// Демо-данные (создаются только если таблицы пусты)
async function seedDemo() {
  const cnt = await db.contacts.count();
  if (cnt === 0) {
    await db.contacts.bulkAdd([
      { name: 'Анна Смирнова', email: 'anna@demo.ru', phone: '+7 901 111-22-33', company: 'ООО ТехИнжиниринг' },
      { name: 'Дмитрий Козлов', email: 'dmitry@demo.ru', phone: '+7 902 444-55-66', company: 'Альфа Групп' },
      { name: 'Елена Морозова', email: 'elena@demo.ru', phone: '+7 903 777-88-99', company: 'Бизнес Партнер' },
    ]);
    await db.deals.bulkAdd([
      {
        name: 'Разработка CRM',
        price: 350000,
        contact_id: 1,
        status: 'В работе',
        createdAt: new Date(2025, 1, 10).toISOString(),
      },
      {
        name: 'Консультация',
        price: 80000,
        contact_id: 2,
        status: 'Новый',
        createdAt: new Date(2025, 2, 5).toISOString(),
      },
      {
        name: 'Интеграция API',
        price: 120000,
        contact_id: 1,
        status: 'Согласование',
        createdAt: new Date(2025, 3, 1).toISOString(),
      },
      {
        name: 'Поддержка сайта',
        price: 45000,
        contact_id: 3,
        status: 'Новый',
        createdAt: new Date(2025, 3, 15).toISOString(),
      },
      {
        name: 'SEO продвижение',
        price: 95000,
        contact_id: 3,
        status: 'Закрыта без успеха',
        createdAt: new Date(2025, 1, 28).toISOString(),
      },
    ]);
    await db.tasks.bulkAdd([
      { title: 'Позвонить Анне', due_date: '2025-04-10', completed: false },
      { title: 'Отправить договор Дмитрию', due_date: '2025-04-15', completed: true },
    ]);
  }
  await loadAll();
}

// ------ Вычисляемые показатели (аналитика) ------
const totalRevenue = computed(() =>
  state.deals.filter((d) => d.status === 'Успешно закрыта').reduce((s, d) => s + (d.price || 0), 0),
);
const activeDealsSum = computed(() =>
  state.deals
    .filter((d) => d.status !== 'Успешно закрыта' && d.status !== 'Закрыта без успеха')
    .reduce((s, d) => s + (d.price || 0), 0),
);
const wonDealsCount = computed(() => state.deals.filter((d) => d.status === 'Успешно закрыта').length);
const totalDealsCount = computed(() => state.deals.length);
const conversionRate = computed(() => {
  const closed = state.deals.filter((d) => d.status === 'Успешно закрыта' || d.status === 'Закрыта без успеха').length;
  const won = state.deals.filter((d) => d.status === 'Успешно закрыта').length;
  return closed === 0 ? 0 : Math.round((won / closed) * 100);
});
const funnelData = computed(() => {
  const stages = ['Новый', 'В работе', 'Согласование', 'Успешно закрыта', 'Закрыта без успеха'];
  return stages.map((stage) => ({
    stage,
    sum: state.deals.filter((d) => d.status === stage).reduce((s, d) => s + (d.price || 0), 0),
  }));
});
const monthlyTrend = computed(() => {
  const now = new Date();
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(d.toLocaleString('ru', { month: 'short', year: 'numeric' }));
  }
  const data = new Array(6).fill(0);
  state.deals.forEach((deal) => {
    if (deal.createdAt && deal.status === 'Успешно закрыта') {
      const date = new Date(deal.createdAt);
      const monthIdx = (now.getFullYear() - date.getFullYear()) * 12 + (now.getMonth() - date.getMonth());
      if (monthIdx >= 0 && monthIdx < 6) data[5 - monthIdx] += deal.price || 0;
    }
  });
  return { labels: months, values: data };
});
const statusDistribution = computed(() => {
  const stages = ['Новый', 'В работе', 'Согласование', 'Успешно закрыта', 'Закрыта без успеха'];
  return stages.map((stage) => ({
    stage,
    count: state.deals.filter((d) => d.status === stage).length,
  }));
});

// ------ Графики ------
let revenueChart = null,
  funnelChart = null,
  statusPieChart = null;
function initCharts() {
  const ctxRev = document.getElementById('revenueChart')?.getContext('2d');
  const ctxFun = document.getElementById('funnelChart')?.getContext('2d');
  const ctxPie = document.getElementById('statusPieChart')?.getContext('2d');
  if (revenueChart) revenueChart.destroy();
  if (funnelChart) funnelChart.destroy();
  if (statusPieChart) statusPieChart.destroy();
  if (ctxRev) {
    revenueChart = new Chart(ctxRev, {
      type: 'line',
      data: {
        labels: monthlyTrend.value.labels,
        datasets: [
          {
            label: 'Выручка (₽)',
            data: monthlyTrend.value.values,
            borderColor: '#1f5ef2',
            backgroundColor: 'rgba(31,94,242,0.1)',
            tension: 0.2,
            fill: true,
          },
        ],
      },
    });
  }
  if (ctxFun) {
    funnelChart = new Chart(ctxFun, {
      type: 'bar',
      data: {
        labels: funnelData.value.map((f) => f.stage),
        datasets: [
          {
            label: 'Сумма сделок (₽)',
            data: funnelData.value.map((f) => f.sum),
            backgroundColor: '#4590ff',
          },
        ],
      },
    });
  }
  if (ctxPie) {
    statusPieChart = new Chart(ctxPie, {
      type: 'pie',
      data: {
        labels: statusDistribution.value.map((s) => s.stage),
        datasets: [
          {
            data: statusDistribution.value.map((s) => s.count),
            backgroundColor: ['#a0c4ff', '#fdffb6', '#caffbf', '#9bf6ff', '#ffc6ff'],
          },
        ],
      },
    });
  }
}

export default {
  name: 'App',
  setup() {
    // ---------- Auth state ----------
    const isLoggedIn = ref(false);
    const authMode = ref('login');
    const authError = ref('');
    const loginForm = reactive({ username: '', password: '' });
    const registerForm = reactive({ username: '', password: '', confirmPassword: '' });

    // ---------- CRM state ----------
    const currentPage = ref('analytics');
    const menu = [
      { key: 'analytics', label: 'Аналитика', icon: '📊' },
      { key: 'contacts', label: 'Контакты', icon: '👥' },
      { key: 'deals', label: 'Сделки', icon: '🤝' },
      { key: 'tasks', label: 'Задачи', icon: '📋' },
    ];
    const pageTitle = computed(() => {
      switch (currentPage.value) {
        case 'analytics':
          return 'Финансовая аналитика';
        case 'contacts':
          return 'Контакты';
        case 'deals':
          return 'Сделки';
        case 'tasks':
          return 'Задачи';
        default:
          return 'CRM';
      }
    });
    const showAddButton = computed(() => ['contacts', 'deals', 'tasks'].includes(currentPage.value));

    // Поиск и фильтры
    const contactSearch = ref('');
    const filteredContacts = computed(() => {
      if (!contactSearch.value) return state.contacts;
      const s = contactSearch.value.toLowerCase();
      return state.contacts.filter((c) => c.name?.toLowerCase().includes(s) || c.email?.toLowerCase().includes(s));
    });
    const dealStatusFilter = ref('all');
    const filteredDeals = computed(() => {
      if (dealStatusFilter.value === 'all') return state.deals;
      return state.deals.filter((d) => d.status === dealStatusFilter.value);
    });
    const taskSearch = ref('');
    const filteredTasks = computed(() => {
      if (!taskSearch.value) return state.tasks;
      const s = taskSearch.value.toLowerCase();
      return state.tasks.filter((t) => t.title?.toLowerCase().includes(s));
    });
    const getContactName = (id) => state.contacts.find((c) => c.id === id)?.name || `ID ${id}`;

    // Модалки и формы — Контакты
    const modalContact = ref(false);
    const editContactId = ref(null);
    const contactForm = ref({ name: '', email: '', phone: '', company: '' });

    const openContactModal = (contact = null) => {
      if (contact) {
        editContactId.value = contact.id;
        // Копируем только нужные поля, без id
        contactForm.value = {
          name: contact.name || '',
          email: contact.email || '',
          phone: contact.phone || '',
          company: contact.company || '',
        };
      } else {
        editContactId.value = null;
        contactForm.value = { name: '', email: '', phone: '', company: '' };
      }
      modalContact.value = true;
    };

    const saveContact = async () => {
      if (!contactForm.value.name) return alert('Введите имя');
      try {
        if (editContactId.value) {
          await updateContact(editContactId.value, contactForm.value);
        } else {
          await addContact(contactForm.value);
        }
        modalContact.value = false;
      } catch (err) {
        console.error('Ошибка при сохранении контакта:', err);
        alert('Не удалось сохранить контакт: ' + err.message);
      }
    };

    // Модалки и формы — Сделки
    const modalDeal = ref(false);
    const editDealId = ref(null);
    const dealForm = ref({ name: '', price: 0, contact_id: null, status: 'Новый' });

    const openDealModal = (deal = null) => {
      if (deal) {
        editDealId.value = deal.id;
        dealForm.value = {
          name: deal.name || '',
          price: deal.price || 0,
          contact_id: deal.contact_id || null,
          status: deal.status || 'Новый',
        };
      } else {
        editDealId.value = null;
        dealForm.value = { name: '', price: 0, contact_id: null, status: 'Новый' };
      }
      modalDeal.value = true;
    };

    const saveDeal = async () => {
      if (!dealForm.value.name) return alert('Название сделки обязательно');
      try {
        if (editDealId.value) {
          await updateDeal(editDealId.value, dealForm.value);
        } else {
          await addDeal(dealForm.value);
        }
        modalDeal.value = false;
      } catch (err) {
        console.error('Ошибка при сохранении сделки:', err);
        alert('Не удалось сохранить сделку: ' + err.message);
      }
    };

    // Модалки и формы — Задачи
    const modalTask = ref(false);
    const editTaskId = ref(null);
    const taskForm = ref({ title: '', due_date: '' });

    const openTaskModal = (task = null) => {
      if (task) {
        editTaskId.value = task.id;
        taskForm.value = { title: task.title || '', due_date: task.due_date || '' };
      } else {
        editTaskId.value = null;
        taskForm.value = { title: '', due_date: '' };
      }
      modalTask.value = true;
    };

    const saveTask = async () => {
      if (!taskForm.value.title) return alert('Введите название задачи');
      try {
        if (editTaskId.value) {
          await updateTask(editTaskId.value, { title: taskForm.value.title, due_date: taskForm.value.due_date });
        } else {
          await addTask({ title: taskForm.value.title, due_date: taskForm.value.due_date });
        }
        modalTask.value = false;
      } catch (err) {
        console.error('Ошибка при сохранении задачи:', err);
        alert('Не удалось сохранить задачу: ' + err.message);
      }
    };

    const updateDealStatus = async (deal) => {
      try {
        await db.deals.update(deal.id, { status: deal.status });
        await loadAll();
      } catch (err) {
        console.error(err);
        alert('Не удалось обновить статус');
      }
    };

    const deleteContactConfirm = (id) => {
      if (confirm('Удалить контакт безвозвратно?')) deleteContact(id);
    };
    const deleteDealConfirm = (id) => {
      if (confirm('Удалить сделку?')) deleteDeal(id);
    };
    const deleteTaskConfirm = (id) => {
      if (confirm('Удалить задачу?')) deleteTask(id);
    };

    const openCreateModal = () => {
      if (currentPage.value === 'contacts') openContactModal();
      else if (currentPage.value === 'deals') openDealModal();
      else if (currentPage.value === 'tasks') openTaskModal();
    };

    // ---------- Auth методы ----------
    const handleLogin = async () => {
      authError.value = '';
      if (!loginForm.username || !loginForm.password) {
        authError.value = 'Заполните все поля';
        return;
      }
      const user = await db.users.where('username').equals(loginForm.username).first();
      if (user && user.password === loginForm.password) {
        sessionStorage.setItem('crm_auth', JSON.stringify({ username: user.username, userId: user.id }));
        isLoggedIn.value = true;
        await seedDemo();
        setTimeout(initCharts, 100);
      } else {
        authError.value = 'Неверное имя пользователя или пароль';
      }
    };

    const handleRegister = async () => {
      authError.value = '';
      if (!registerForm.username || !registerForm.password) {
        authError.value = 'Заполните все поля';
        return;
      }
      if (registerForm.password !== registerForm.confirmPassword) {
        authError.value = 'Пароли не совпадают';
        return;
      }
      const existing = await db.users.where('username').equals(registerForm.username).first();
      if (existing) {
        authError.value = 'Пользователь с таким именем уже существует';
        return;
      }
      const newId = await db.users.add({
        username: registerForm.username,
        password: registerForm.password,
      });
      sessionStorage.setItem('crm_auth', JSON.stringify({ username: registerForm.username, userId: newId }));
      isLoggedIn.value = true;
      await seedDemo();
      setTimeout(initCharts, 100);
    };

    const logout = () => {
      sessionStorage.removeItem('crm_auth');
      isLoggedIn.value = false;
      loginForm.username = '';
      loginForm.password = '';
      registerForm.username = '';
      registerForm.password = '';
      registerForm.confirmPassword = '';
      authError.value = '';
    };

    const checkAuth = async () => {
      const stored = sessionStorage.getItem('crm_auth');
      if (stored) {
        try {
          const { username } = JSON.parse(stored);
          const user = await db.users.where('username').equals(username).first();
          if (user) {
            isLoggedIn.value = true;
            await seedDemo();
            setTimeout(initCharts, 100);
            return;
          }
        } catch (e) {}
      }
      isLoggedIn.value = false;
      sessionStorage.removeItem('crm_auth');
    };

    onMounted(async () => {
      await checkAuth();
    });

    watch(
      () => state.deals,
      () => setTimeout(initCharts, 50),
      { deep: true },
    );

    return {
      // Auth
      isLoggedIn,
      authMode,
      authError,
      loginForm,
      registerForm,
      handleLogin,
      handleRegister,
      logout,
      // CRM
      state,
      currentPage,
      menu,
      pageTitle,
      showAddButton,
      totalRevenue,
      activeDealsSum,
      wonDealsCount,
      totalDealsCount,
      conversionRate,
      contactSearch,
      filteredContacts,
      dealStatusFilter,
      filteredDeals,
      getContactName,
      taskSearch,
      filteredTasks,
      updateDealStatus,
      toggleTask,
      deleteTaskConfirm,
      deleteContactConfirm,
      deleteDealConfirm,
      modalContact,
      editContactId,
      contactForm,
      openContactModal,
      saveContact,
      modalDeal,
      editDealId,
      dealForm,
      openDealModal,
      saveDeal,
      modalTask,
      editTaskId,
      taskForm,
      openTaskModal,
      saveTask,
      openCreateModal,
      getStatusClass: (status) => {
        const map = {
          Новый: 'new',
          'В работе': 'work',
          Согласование: 'negotiation',
          'Успешно закрыта': 'won',
          'Закрыта без успеха': 'lost',
        };
        return map[status] || '';
      },
    };
  },
};
</script>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  font-family: 'Inter', sans-serif;
}
body {
  background: #f5f9ff;
}

/* ИСПРАВЛЕНИЕ: .app должен занимать всю ширину */
.app {
  display: flex;
  min-height: 100vh;
  width: 100%;
}

/* Auth styles — центрирование */
.auth-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  width: 100%; /* ИСПРАВЛЕНИЕ: занимаем всю ширину flex-контейнера */
  background: linear-gradient(135deg, #f5f9ff 0%, #e6edf4 100%);
  padding: 20px;
}
.auth-card {
  background: white;
  border-radius: 32px;
  padding: 32px 28px;
  width: 100%;
  max-width: 440px;
  box-shadow: 0 20px 35px -8px rgba(0, 0, 0, 0.1);
}
.auth-header {
  text-align: center;
  margin-bottom: 28px;
}
.auth-header .logo {
  font-size: 32px;
  font-weight: 800;
  background: linear-gradient(135deg, #1f5ef2, #4590ff);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
.auth-header small {
  font-size: 13px;
  color: #6a7b99;
  display: block;
  margin-top: 6px;
}
.auth-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  background: #f0f4fa;
  border-radius: 48px;
  padding: 4px;
}
.tab {
  flex: 1;
  text-align: center;
  padding: 10px 0;
  border: none;
  background: transparent;
  border-radius: 40px;
  font-weight: 600;
  cursor: pointer;
  transition: 0.2s;
  color: #2c3f5c;
}
.tab.active {
  background: white;
  color: #1f5ef2;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}
.full-width {
  width: 100%;
  justify-content: center;
}
.error-message {
  background: #ffe8e8;
  color: #c2410c;
  padding: 10px 14px;
  border-radius: 16px;
  font-size: 13px;
  margin-bottom: 16px;
  text-align: center;
}

/* Sidebar and main content */
.sidebar {
  width: 280px;
  background: #fff;
  border-right: 1px solid #e6edf4;
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  z-index: 20;
  overflow-y: auto;
}
.logo-area {
  padding: 28px 24px;
  border-bottom: 1px solid #eef2f8;
  margin-bottom: 24px;
}
.logo {
  font-size: 26px;
  font-weight: 800;
  background: linear-gradient(135deg, #1f5ef2, #4590ff);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
.logo-area small {
  font-size: 12px;
  color: #6a7b99;
  display: block;
  margin-top: 6px;
}
.nav-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 20px;
  margin: 4px 16px;
  border-radius: 14px;
  color: #2c3f5c;
  font-weight: 500;
  cursor: pointer;
  transition: 0.2s;
}
.nav-icon {
  font-size: 1.3rem;
  width: 24px;
  text-align: center;
}
.nav-item.active,
.nav-item:hover {
  background: #eef3fe;
  color: #1f5ef2;
}
.main-content {
  flex: 1;
  margin-left: 280px;
  padding: 28px 32px;
}
.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  background: white;
  padding: 16px 28px;
  border-radius: 28px;
  box-shadow:
    0 2px 8px rgba(0, 0, 0, 0.02),
    0 1px 2px rgba(0, 0, 0, 0.03);
}
.page-title {
  font-size: 28px;
  font-weight: 700;
  color: #0f2b3c;
}
.btn-primary {
  background: #1f5ef2;
  border: none;
  padding: 10px 22px;
  border-radius: 40px;
  color: white;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: 0.2s;
}
.btn-primary:hover {
  background: #0a4cd6;
  transform: translateY(-1px);
}
.btn-secondary {
  background: #f0f4fa;
  border: 1px solid #dce3ec;
  padding: 8px 18px;
  border-radius: 30px;
  cursor: pointer;
  font-weight: 500;
}
.btn-icon {
  font-size: 1.2rem;
}
.card {
  background: white;
  border-radius: 28px;
  padding: 24px;
  margin-bottom: 28px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.02);
}
table {
  width: 100%;
  border-collapse: collapse;
}
th,
td {
  text-align: left;
  padding: 14px 8px;
  border-bottom: 1px solid #edf2f8;
}
th {
  font-weight: 600;
  color: #425c7a;
}
.badge {
  padding: 4px 12px;
  border-radius: 40px;
  font-size: 12px;
  font-weight: 500;
  display: inline-block;
}
.status-new {
  background: #e8edff;
  color: #1f5ef2;
}
.status-work {
  background: #fff0db;
  color: #e68a2e;
}
.status-negotiation {
  background: #e3f2fd;
  color: #0b5e9e;
}
.status-won {
  background: #e0f7ea;
  color: #1e7b4a;
}
.status-lost {
  background: #ffe8e8;
  color: #c2410c;
}
.task-pending {
  background: #fff2db;
  color: #c67c00;
}
.task-done {
  background: #e0f7ea;
  color: #1e7b4a;
}
.badge-select {
  border: none;
  padding: 6px 12px;
  border-radius: 40px;
  font-size: 12px;
  font-weight: 500;
  appearance: none;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 8px center;
  background-size: 14px;
  padding-right: 28px;
  cursor: pointer;
}
.action-icons {
  display: flex;
  gap: 4px;
  align-items: center;
}
.icon-btn {
  cursor: pointer;
  font-size: 1.1rem;
  padding: 4px;
  border-radius: 8px;
  transition: 0.2s;
}
.icon-btn:hover {
  background: #eef3fe;
}
.modal-mask {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal-container {
  background: white;
  width: 520px;
  max-width: 92%;
  border-radius: 32px;
  padding: 28px;
}
.form-group {
  margin-bottom: 18px;
}
label {
  font-weight: 600;
  display: block;
  margin-bottom: 6px;
  color: #2c3e5c;
}
input,
select {
  width: 100%;
  padding: 12px 14px;
  border-radius: 16px;
  border: 1px solid #cfdee9;
  font-size: 14px;
}
input:focus,
select:focus {
  outline: none;
  border-color: #1f5ef2;
}
.kpi-row {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
  margin-bottom: 32px;
}
.kpi-card {
  background: white;
  border-radius: 28px;
  padding: 22px;
  flex: 1;
  min-width: 180px;
  border: 1px solid #e9eef5;
}
.kpi-value {
  font-size: 36px;
  font-weight: 800;
  color: #1f2f4a;
}
.search-input {
  padding: 10px 16px;
  border-radius: 40px;
  border: 1px solid #dee5ef;
  width: 260px;
  background: white;
}
.flex-between {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}
@media (max-width: 768px) {
  .sidebar {
    width: 80px;
  }
  .sidebar .nav-item span:not(.nav-icon) {
    display: none;
  }
  .main-content {
    margin-left: 80px;
    padding: 16px;
  }
}
</style>
