<template>
  <div class="app">
    <!-- AUTH -->
    <div v-if="!isAuth" class="auth">
      <div class="auth-box">
        <h1 class="logo">FinCore Pro</h1>

        <input v-model="form.login" placeholder="Логин" />
        <input v-model="form.password" type="password" placeholder="Пароль" />

        <select v-model="form.role">
          <option value="owner">Админ</option>
          <option value="manager">Менеджер</option>
          <option value="user">Пользователь</option>
        </select>

        <button class="primary" @click="login">Войти</button>
      </div>
    </div>

    <!-- APP -->
    <div v-else class="layout">
      <aside class="sidebar">
        <h2>FinCore</h2>
        <p>{{ user.role }}</p>

        <button @click="tab = 'dashboard'">Дашборд</button>
        <button v-if="isUser" @click="tab = 'orders'">Мои заказы</button>
        <button v-if="isManager || isOwner" @click="tab = 'manageOrders'">
          Управление
        </button>

        <button class="logout" @click="logout">Выйти</button>
      </aside>

      <main class="content">
        <!-- DASHBOARD -->
        <section v-if="tab === 'dashboard'">
          <div class="grid">
            <div class="card">
              <h3>Всего заказов</h3>
              <p>{{ orders.length }}</p>
            </div>
            <div class="card">
              <h3>Новые</h3>
              <p>{{ newOrders }}</p>
            </div>
            <div class="card">
              <h3>Завершено</h3>
              <p>{{ completed }}</p>
            </div>
          </div>
        </section>

        <!-- USER -->
        <section v-if="tab === 'orders'">
          <div class="card">
            <h3>Создать заказ</h3>
            <input v-model="newOrder.title" placeholder="Название" />
            <textarea v-model="newOrder.desc" placeholder="Описание"></textarea>
            <select v-model="newOrder.priority">
              <option>Низкий</option>
              <option>Средний</option>
              <option>Высокий</option>
            </select>
            <button class="primary" @click="createOrder">Создать</button>
          </div>

          <div v-for="o in myOrders" :key="o.id" class="item">
            <div>
              <b>{{ o.title }}</b>
              <p>{{ o.desc }}</p>
              <small>{{ o.status }}</small>
            </div>
          </div>
        </section>

        <!-- MANAGER -->
        <section v-if="tab === 'manageOrders'">
          <div class="card toolbar">
            <input v-model="search" placeholder="Поиск..." />
            <select v-model="filterStatus">
              <option value="">Все</option>
              <option>Новый</option>
              <option>В работе</option>
              <option>Завершён</option>
            </select>
          </div>

          <!-- CHARTS -->
          <div class="grid">
            <div class="card">
              <h3>Статусы</h3>
              <canvas ref="statusChartRef"></canvas>
            </div>
            <div class="card">
              <h3>Приоритеты</h3>
              <canvas ref="priorityChartRef"></canvas>
            </div>
          </div>

          <div v-for="o in filteredOrders" :key="o.id" class="item">
            <div>
              <b>{{ o.title }}</b>
              <p>{{ o.desc }}</p>
              <small>{{ o.user }}</small>
            </div>

            <div class="actions">
              <select v-model="o.status" @change="saveOrders">
                <option>Новый</option>
                <option>В работе</option>
                <option>Завершён</option>
              </select>

              <select v-model="o.priority" @change="saveOrders">
                <option>Низкий</option>
                <option>Средний</option>
                <option>Высокий</option>
              </select>

              <button @click="editOrder(o)">✎</button>
              <button v-if="isOwner" @click="deleteOrder(o.id)">✕</button>
            </div>
          </div>
        </section>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import Chart from "chart.js/auto";

const isAuth = ref(false);
const form = ref({ login: "", password: "", role: "user" });
const user = ref({ role: "", login: "" });

const login = () => {
  if (form.value.login) {
    user.value = { role: form.value.role, login: form.value.login };
    isAuth.value = true;
  }
};

const logout = () => (isAuth.value = false);

const isOwner = computed(() => user.value.role === "owner");
const isManager = computed(() => user.value.role === "manager");
const isUser = computed(() => user.value.role === "user");

const tab = ref("dashboard");

// DB
const DB_KEY = "fin_app";
const load = () => JSON.parse(localStorage.getItem(DB_KEY) || "{}");
const save = (d: any) => localStorage.setItem(DB_KEY, JSON.stringify(d));

// ORDERS
const orders = ref<any[]>([]);
const newOrder = ref({
  title: "",
  desc: "",
  status: "Новый",
  priority: "Средний",
});

const createOrder = () => {
  if (!newOrder.value.title) return;
  orders.value.push({
    ...newOrder.value,
    id: Date.now(),
    user: user.value.login,
  });
  newOrder.value = {
    title: "",
    desc: "",
    status: "Новый",
    priority: "Средний",
  };
  saveOrders();
};

const saveOrders = () => save({ orders: orders.value });

const deleteOrder = (id: number) => {
  orders.value = orders.value.filter((o) => o.id !== id);
  saveOrders();
};

// FILTER
const search = ref("");
const filterStatus = ref("");

const filteredOrders = computed(() => {
  return orders.value.filter((o) => {
    const s = o.title.toLowerCase().includes(search.value.toLowerCase());
    const f = filterStatus.value ? o.status === filterStatus.value : true;
    return s && f;
  });
});

const editOrder = (o: any) => {
  const t = prompt("Новое название", o.title);
  if (t) o.title = t;
  saveOrders();
};

const myOrders = computed(() =>
  orders.value.filter((o) => o.user === user.value.login),
);

const completed = computed(
  () => orders.value.filter((o) => o.status === "Завершён").length,
);
const newOrders = computed(
  () => orders.value.filter((o) => o.status === "Новый").length,
);

// CHARTS
const statusChartRef = ref();
const priorityChartRef = ref();
let statusChart: any;
let priorityChart: any;

const buildCharts = () => {
  if (!statusChartRef.value || !priorityChartRef.value) return;

  const statusCounts = {
    Новый: orders.value.filter((o) => o.status === "Новый").length,
    "В работе": orders.value.filter((o) => o.status === "В работе").length,
    Завершён: orders.value.filter((o) => o.status === "Завершён").length,
  };

  const priorityCounts = {
    Низкий: orders.value.filter((o) => o.priority === "Низкий").length,
    Средний: orders.value.filter((o) => o.priority === "Средний").length,
    Высокий: orders.value.filter((o) => o.priority === "Высокий").length,
  };

  if (statusChart) statusChart.destroy();
  statusChart = new Chart(statusChartRef.value, {
    type: "doughnut",
    data: {
      labels: Object.keys(statusCounts),
      datasets: [{ data: Object.values(statusCounts) }],
    },
  });

  if (priorityChart) priorityChart.destroy();
  priorityChart = new Chart(priorityChartRef.value, {
    type: "bar",
    data: {
      labels: Object.keys(priorityCounts),
      datasets: [{ data: Object.values(priorityCounts) }],
    },
  });
};

watch(tab, (t) => {
  if (t === "manageOrders") {
    setTimeout(() => buildCharts(), 0);
  }
});

watch(orders, buildCharts, { deep: true });

onMounted(() => {
  const db = load();
  orders.value = db.orders || [];
});
</script>

<style>
.app {
  font-family: Inter, sans-serif;
  height: 100vh;
  background: #0f172a;
}

/* AUTH */
.auth {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  background: linear-gradient(135deg, #4f46e5, #06b6d4);
}

.auth-box {
  background: rgba(255, 255, 255, 0.95);
  padding: 40px;
  border-radius: 20px;
  width: 320px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
}

/* LAYOUT */
.layout {
  display: flex;
  height: 100%;
}

/* SIDEBAR */
.sidebar {
  width: 240px;
  background: #020617;
  color: white;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.sidebar button {
  background: none;
  border: none;
  color: #cbd5f5;
  padding: 10px;
  border-radius: 10px;
  text-align: left;
  transition: 0.2s;
}

.sidebar button:hover {
  background: #1e293b;
  color: white;
}

.logout {
  margin-top: auto;
  background: #ef4444;
  color: white;
}

/* CONTENT */
.content {
  flex: 1;
  padding: 25px;
  background: #f8fafc;
  overflow: auto;
}

/* GRID */
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

/* CARD */
.card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.08);
}

/* LIST */
.item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  padding: 16px;
  border-radius: 14px;
  margin-bottom: 10px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
}

.item div {
  max-width: 60%;
}

/* ACTIONS */
.actions {
  display: flex;
  gap: 8px;
}

/* INPUTS */
input,
textarea,
select {
  width: 100%;
  padding: 10px;
  border-radius: 10px;
  border: 1px solid #ddd;
  margin-bottom: 8px;
}

/* BUTTON */
.primary {
  background: #4f46e5;
  color: white;
  border: none;
  padding: 10px;
  border-radius: 10px;
  cursor: pointer;
  transition: 0.2s;
}

.primary:hover {
  background: #4338ca;
}

/* TOOLBAR */
.toolbar {
  display: flex;
  gap: 10px;
  align-items: center;
}
</style>
