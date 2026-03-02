<template>
  <div class="container">
    <h1 class="title">Сервис малого бизнеса с графиками</h1>

    <!-- Tabs -->
    <div class="tabs">
      <button
        v-for="tab in tabs"
        :key="tab"
        @click="activeTab = tab"
        :class="['tab-btn', activeTab === tab ? 'active' : '']"
      >
        {{ tab }}
      </button>
    </div>

    <div class="tab-content">
      <!-- Финансы -->
      <section v-if="activeTab === 'Финансы'" class="card">
        <h2>Транзакции</h2>
        <form @submit.prevent="addTransaction" class="form">
          <input
            v-model="newTransaction.name"
            placeholder="Описание"
            required
          />
          <input
            v-model.number="newTransaction.amount"
            type="number"
            placeholder="Сумма"
            required
          />
          <select v-model="newTransaction.type">
            <option value="income">Доход</option>
            <option value="expense">Расход</option>
          </select>
          <select v-model="newTransaction.category">
            <option v-for="cat in categories" :key="cat.id" :value="cat.name">
              {{ cat.name }} ({{ cat.type }})
            </option>
          </select>
          <button type="submit" class="btn btn-add">Добавить</button>
        </form>

        <table class="transactions">
          <thead>
            <tr>
              <th>Описание</th>
              <th>Сумма</th>
              <th>Тип</th>
              <th>Категория</th>
              <th>Действие</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="t in transactions" :key="t.id">
              <td>{{ t.name }}</td>
              <td>{{ t.amount }}</td>
              <td>{{ t.type }}</td>
              <td>{{ t.category }}</td>
              <td>
                <button @click="deleteTransaction(t.id)" class="btn btn-delete">
                  Удалить
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        <div class="analytics">
          <div class="card-analytics income-card">Доход: {{ totalIncome }}</div>
          <div class="card-analytics expense-card">
            Расход: {{ totalExpense }}
          </div>
          <div class="card-analytics profit-card">
            Прибыль: {{ totalProfit }}
          </div>
        </div>

        <!-- Графики -->
        <div class="charts">
          <canvas id="incomeChart"></canvas>
          <canvas id="expenseChart"></canvas>
        </div>
      </section>

      <!-- Клиенты -->
      <section v-if="activeTab === 'Клиенты'" class="card">
        <h2>Клиенты</h2>
        <form @submit.prevent="addClient" class="form">
          <input v-model="newClient.name" placeholder="Имя клиента" required />
          <input v-model="newClient.contact" placeholder="Контакт" />
          <button type="submit" class="btn btn-add">Добавить клиента</button>
        </form>
        <ul class="client-list">
          <li v-for="c in clients" :key="c.id">
            {{ c.name }} — {{ c.contact }}
            <button @click="deleteClient(c.id)" class="btn btn-delete">
              Удалить
            </button>
          </li>
        </ul>
      </section>

      <!-- Категории -->
      <section v-if="activeTab === 'Категории'" class="card">
        <h2>Категории</h2>
        <form @submit.prevent="addCategory" class="form">
          <input
            v-model="newCategory.name"
            placeholder="Название категории"
            required
          />
          <select v-model="newCategory.type">
            <option value="income">Доход</option>
            <option value="expense">Расход</option>
          </select>
          <button type="submit" class="btn btn-add">Добавить категорию</button>
        </form>
        <ul class="category-list">
          <li v-for="cat in categories" :key="cat.id">
            {{ cat.name }} — {{ cat.type }}
            <button @click="deleteCategory(cat.id)" class="btn btn-delete">
              Удалить
            </button>
          </li>
        </ul>
      </section>

      <!-- Задачи -->
      <section v-if="activeTab === 'Задачи'" class="card">
        <h2>Задачи</h2>
        <form @submit.prevent="addTask" class="form">
          <input
            v-model="newTask.name"
            placeholder="Название задачи"
            required
          />
          <select v-model="newTask.status">
            <option value="pending">В ожидании</option>
            <option value="done">Выполнено</option>
          </select>
          <button type="submit" class="btn btn-add">Добавить задачу</button>
        </form>
        <ul class="task-list">
          <li v-for="t in tasks" :key="t.id">
            {{ t.name }} — {{ t.status }}
            <button @click="deleteTask(t.id)" class="btn btn-delete">
              Удалить
            </button>
          </li>
        </ul>
      </section>

      <!-- Товары/Инвентарь -->
      <section v-if="activeTab === 'Товары'" class="card">
        <h2>Товары / Услуги</h2>
        <form @submit.prevent="addItem" class="form">
          <input
            v-model="newItem.name"
            placeholder="Название товара/услуги"
            required
          />
          <input
            v-model.number="newItem.price"
            type="number"
            placeholder="Цена"
            required
          />
          <input
            v-model.number="newItem.stock"
            type="number"
            placeholder="Количество"
            required
          />
          <select v-model="newItem.category">
            <option v-for="cat in categories" :key="cat.id" :value="cat.name">
              {{ cat.name }}
            </option>
          </select>
          <button type="submit" class="btn btn-add">Добавить товар</button>
        </form>
        <ul class="item-list">
          <li v-for="i in items" :key="i.id">
            {{ i.name }} — {{ i.price }}₽ — {{ i.stock }} шт — {{ i.category }}
            <button @click="deleteItem(i.id)" class="btn btn-delete">
              Удалить
            </button>
          </li>
        </ul>
      </section>

      <!-- Заказы -->
      <section v-if="activeTab === 'Заказы'" class="card">
        <h2>Заказы</h2>
        <form @submit.prevent="addOrder" class="form">
          <select v-model="newOrder.client">
            <option v-for="c in clients" :key="c.id" :value="c.name">
              {{ c.name }}
            </option>
          </select>
          <select v-model="newOrder.item">
            <option v-for="i in items" :key="i.id" :value="i.name">
              {{ i.name }}
            </option>
          </select>
          <input
            v-model.number="newOrder.quantity"
            type="number"
            placeholder="Количество"
            required
          />
          <button type="submit" class="btn btn-add">Добавить заказ</button>
        </form>
        <ul class="order-list">
          <li v-for="o in orders" :key="o.id">
            Клиент: {{ o.client }}, Товар: {{ o.item }}, Кол-во:
            {{ o.quantity }}, Итог: {{ o.total }}₽
            <button @click="deleteOrder(o.id)" class="btn btn-delete">
              Удалить
            </button>
          </li>
        </ul>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { openDB } from "idb";
import Chart from "chart.js/auto";

const tabs = ["Финансы", "Клиенты", "Категории", "Задачи", "Товары", "Заказы"];
const activeTab = ref("Финансы");

let db;
async function initDB() {
  db = await openDB("businessDB", 1, {
    upgrade(db) {
      db.createObjectStore("transactions", { keyPath: "id" });
      db.createObjectStore("clients", { keyPath: "id" });
      db.createObjectStore("categories", { keyPath: "id" });
      db.createObjectStore("tasks", { keyPath: "id" });
      db.createObjectStore("items", { keyPath: "id" });
      db.createObjectStore("orders", { keyPath: "id" });
    },
  });
  loadAll();
}

const transactions = ref([]),
  clients = ref([]),
  categories = ref([]),
  tasks = ref([]),
  items = ref([]),
  orders = ref([]);

// Charts
let incomeChart = null,
  expenseChart = null;
function updateCharts() {
  const incomeData = {},
    expenseData = {};
  transactions.value.forEach((t) => {
    if (t.type === "income")
      incomeData[t.category] = (incomeData[t.category] || 0) + t.amount;
    if (t.type === "expense")
      expenseData[t.category] = (expenseData[t.category] || 0) + t.amount;
  });
  const incomeCtx = document.getElementById("incomeChart");
  const expenseCtx = document.getElementById("expenseChart");
  if (incomeChart) incomeChart.destroy();
  if (expenseChart) expenseChart.destroy();
  incomeChart = new Chart(incomeCtx, {
    type: "bar",
    data: {
      labels: Object.keys(incomeData),
      datasets: [
        {
          label: "Доходы",
          data: Object.values(incomeData),
          backgroundColor: "#34d399",
        },
      ],
    },
    options: { responsive: true, plugins: { legend: { display: false } } },
  });
  expenseChart = new Chart(expenseCtx, {
    type: "bar",
    data: {
      labels: Object.keys(expenseData),
      datasets: [
        {
          label: "Расходы",
          data: Object.values(expenseData),
          backgroundColor: "#ef4444",
        },
      ],
    },
    options: { responsive: true, plugins: { legend: { display: false } } },
  });
}

async function loadAll() {
  transactions.value = await db.getAll("transactions");
  clients.value = await db.getAll("clients");
  categories.value = await db.getAll("categories");
  tasks.value = await db.getAll("tasks");
  items.value = await db.getAll("items");
  orders.value = await db.getAll("orders");
  updateCharts();
}

// Transactions
const newTransaction = ref({
  name: "",
  amount: 0,
  type: "income",
  category: "",
});
async function addTransaction() {
  const id = Date.now();
  await db.put("transactions", { ...newTransaction.value, id });
  newTransaction.value = { name: "", amount: 0, type: "income", category: "" };
  await loadAll();
}
async function deleteTransaction(id) {
  await db.delete("transactions", id);
  await loadAll();
}
const totalIncome = ref(0),
  totalExpense = ref(0);
onMounted(() => {
  totalIncome.value = transactions.value
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + t.amount, 0);
});

// Clients
const newClient = ref({ name: "", contact: "" });
async function addClient() {
  const id = Date.now();
  await db.put("clients", { ...newClient.value, id });
  newClient.value = { name: "", contact: "" };
  await loadAll();
}
async function deleteClient(id) {
  await db.delete("clients", id);
  await loadAll();
}

// Categories
const newCategory = ref({ name: "", type: "income" });
async function addCategory() {
  const id = Date.now();
  await db.put("categories", { ...newCategory.value, id });
  newCategory.value = { name: "", type: "income" };
  await loadAll();
}
async function deleteCategory(id) {
  await db.delete("categories", id);
  await loadAll();
}

// Tasks
const newTask = ref({ name: "", status: "pending" });
async function addTask() {
  const id = Date.now();
  await db.put("tasks", { ...newTask.value, id });
  newTask.value = { name: "", status: "pending" };
  await loadAll();
}
async function deleteTask(id) {
  await db.delete("tasks", id);
  await loadAll();
}

// Items
const newItem = ref({ name: "", price: 0, stock: 0, category: "" });
async function addItem() {
  const id = Date.now();
  await db.put("items", { ...newItem.value, id });
  newItem.value = { name: "", price: 0, stock: 0, category: "" };
  await loadAll();
}
async function deleteItem(id) {
  await db.delete("items", id);
  await loadAll();
}

// Orders
const newOrder = ref({ client: "", item: "", quantity: 1, total: 0 });
async function addOrder() {
  const itemObj = items.value.find((i) => i.name === newOrder.value.item);
  const total = itemObj ? itemObj.price * newOrder.value.quantity : 0;
  const id = Date.now();
  await db.put("orders", { ...newOrder.value, id, total });
  newOrder.value = { client: "", item: "", quantity: 1, total: 0 };
  await loadAll();
}

async function deleteOrder(id) {
  await db.delete("orders", id);
  await loadAll();
}

onMounted(initDB);
</script>

<style scoped>
.container {
  max-width: 1200px;
  margin: 20px auto;
  font-family: "Segoe UI", sans-serif;
  color: #333;
}
.title {
  text-align: center;
  font-size: 2rem;
  margin-bottom: 20px;
  color: #4f46e5;
}
.card {
  background: #fff;
  padding: 25px;
  margin-bottom: 20px;
  border-radius: 16px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
}
.form {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  margin-bottom: 10px;
}
.form input,
.form select {
  padding: 12px;
  border-radius: 12px;
  border: 1px solid #ccc;
  outline: none;
  transition: 0.3s;
}
.form input:focus,
.form select:focus {
  border-color: #4f46e5;
  box-shadow: 0 0 8px rgba(79, 70, 229, 0.3);
}
.btn {
  padding: 10px 24px;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-weight: bold;
  transition: 0.3s;
  margin: 2px;
}
.btn:hover {
  transform: scale(1.05);
}
.btn-add {
  background: linear-gradient(to right, #4f46e5, #3b82f6);
  color: #fff;
}
.btn-delete {
  background: #ef4444;
  color: #fff;
}
.tabs {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  justify-content: center;
  flex-wrap: wrap;
}
.tab-btn {
  padding: 10px 20px;
  border-radius: 12px;
  border: 1px solid #ccc;
  cursor: pointer;
  background: #e5e7eb;
  transition: 0.3s;
}
.tab-btn.active {
  background: #4f46e5;
  color: #fff;
  border-color: #4f46e5;
}
.charts {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
  margin-top: 20px;
}
canvas {
  max-width: 400px;
  max-height: 300px;
  background: #f9fafb;
  border-radius: 12px;
  padding: 12px;
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.08);
}
.transactions {
  width: 100%;
  border-collapse: collapse;
  margin-top: 10px;
}
.transactions th,
.transactions td {
  border: 1px solid #ddd;
  padding: 8px;
  text-align: left;
}
.analytics {
  display: flex;
  gap: 12px;
  margin-top: 15px;
  flex-wrap: wrap;
}
.card-analytics {
  flex: 1;
  padding: 20px;
  border-radius: 16px;
  color: #fff;
  text-align: center;
  font-weight: bold;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.1);
  transition: 0.3s;
}
.card-analytics:hover {
  transform: scale(1.05);
}
.income-card {
  background: linear-gradient(135deg, #10b981, #34d399);
}
.expense-card {
  background: linear-gradient(135deg, #ef4444, #f87171);
}
.profit-card {
  background: linear-gradient(135deg, #3b82f6, #60a5fa);
}
.client-list,
.category-list,
.task-list,
.item-list,
.order-list {
  list-style: none;
  padding-left: 0;
  margin-top: 12px;
}
.client-list li,
.category-list li,
.task-list li,
.item-list li,
.order-list li {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #eee;
  transition: 0.3s;
}
.client-list li:hover,
.category-list li:hover,
.task-list li:hover,
.item-list li:hover,
.order-list li:hover {
  background: #f9fafb;
}
</style>
