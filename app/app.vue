<template>
  <div class="container">
    <h1 class="title">Финансовый сервис малого бизнеса</h1>

    <!-- Форма добавления транзакции -->
    <section class="card">
      <h2>Добавить транзакцию</h2>
      <form @submit.prevent="addTransaction" class="form">
        <input
          v-model="newTransaction.name"
          type="text"
          placeholder="Описание"
        />
        <input
          v-model.number="newTransaction.amount"
          type="number"
          placeholder="Сумма"
        />
        <select v-model="newTransaction.type">
          <option value="income">Доход</option>
          <option value="expense">Расход</option>
        </select>
        <input v-model="newTransaction.date" type="date" />
        <button type="submit" class="btn btn-add">Добавить</button>
      </form>
    </section>

    <!-- Фильтры -->
    <section class="filters">
      <button @click="setFilter('all')" :class="filterButton('all')">
        Все
      </button>
      <button @click="setFilter('income')" :class="filterButton('income')">
        Доходы
      </button>
      <button @click="setFilter('expense')" :class="filterButton('expense')">
        Расходы
      </button>
    </section>

    <!-- Таблица транзакций -->
    <section class="card">
      <table class="transactions">
        <thead>
          <tr>
            <th>Дата</th>
            <th>Описание</th>
            <th>Сумма</th>
            <th>Тип</th>
            <th>Действие</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="t in filteredTransactions" :key="t.id">
            <td>{{ t.date }}</td>
            <td>{{ t.name }}</td>
            <td>{{ t.amount }}</td>
            <td>{{ t.type }}</td>
            <td>
              <button @click="deleteTransaction(t.id)" class="btn btn-delete">
                Удалить
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </section>

    <!-- Финансовая аналитика -->
    <section class="card analytics">
      <h2>Финансовая аналитика</h2>
      <p>
        Общий доход: <span class="income">{{ totalIncome }}</span>
      </p>
      <p>
        Общий расход: <span class="expense">{{ totalExpense }}</span>
      </p>
      <p>
        Прибыль: <span class="profit">{{ profit }}</span>
      </p>
    </section>

    <!-- График -->
    <section class="card">
      <h2>График доходов и расходов</h2>
      <canvas ref="chart" height="200"></canvas>
    </section>

    <!-- Экспорт/Импорт -->
    <section class="card">
      <h2>Экспорт / Импорт</h2>
      <button @click="exportData" class="btn btn-export">Экспорт JSON</button>
      <input type="file" @change="importData" class="file-input" />
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from "vue";

let db;
const transactions = ref([]);
const newTransaction = ref({
  name: "",
  amount: 0,
  type: "income",
  date: new Date().toISOString().split("T")[0],
});
const filter = ref("all");
const chart = ref(null);
let chartInstance = null;

onMounted(async () => {
  if (process.client) {
    const { openDB } = await import("idb");
    const Chart = (await import("chart.js/auto")).default;

    db = await openDB("finance-db", 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("transactions")) {
          db.createObjectStore("transactions", {
            keyPath: "id",
            autoIncrement: true,
          });
        }
      },
    });

    transactions.value = await db.getAll("transactions");
    updateChart(Chart);
  }
});

async function addTransaction() {
  if (!process.client) return;
  if (!newTransaction.value.name || newTransaction.value.amount <= 0) return;
  const id = await db.add("transactions", { ...newTransaction.value });
  transactions.value.push({ ...newTransaction.value, id });
  newTransaction.value = {
    name: "",
    amount: 0,
    type: "income",
    date: new Date().toISOString().split("T")[0],
  };
}

async function deleteTransaction(id) {
  if (!process.client) return;
  await db.delete("transactions", id);
  transactions.value = transactions.value.filter((t) => t.id !== id);
}

function setFilter(type) {
  filter.value = type;
}
const filteredTransactions = computed(() => {
  if (filter.value === "all") return transactions.value;
  return transactions.value.filter((t) => t.type === filter.value);
});
function filterButton(type) {
  return filter.value === type ? "btn btn-filter-active" : "btn btn-filter";
}

const totalIncome = computed(() =>
  transactions.value
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0),
);
const totalExpense = computed(() =>
  transactions.value
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0),
);
const profit = computed(() => totalIncome.value - totalExpense.value);

function updateChart(Chart) {
  if (!process.client) return;
  const labels = transactions.value.map((t) => t.date + " | " + t.name);
  const incomes = transactions.value.map((t) =>
    t.type === "income" ? t.amount : 0,
  );
  const expenses = transactions.value.map((t) =>
    t.type === "expense" ? t.amount : 0,
  );

  if (chartInstance) chartInstance.destroy();
  chartInstance = new Chart(chart.value, {
    type: "bar",
    data: {
      labels,
      datasets: [
        { label: "Доход", data: incomes, backgroundColor: "green" },
        { label: "Расход", data: expenses, backgroundColor: "red" },
      ],
    },
    options: { responsive: true },
  });
}

watch(transactions, async () => {
  if (!process.client) return;
  const Chart = (await import("chart.js/auto")).default;
  updateChart(Chart);
});

function exportData() {
  const dataStr = JSON.stringify(transactions.value, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "transactions.json";
  a.click();
  URL.revokeObjectURL(url);
}

async function importData(event) {
  const file = event.target.files[0];
  if (!file) return;
  const text = await file.text();
  const imported = JSON.parse(text);
  for (const t of imported) {
    await db.put("transactions", t);
  }
  transactions.value = await db.getAll("transactions");
}
</script>

<style scoped>
/* Основные стили */
body,
html {
  margin: 0;
  padding: 0;
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
  background: #f0f4f8;
  color: #333;
}
.container {
  max-width: 1000px;
  margin: auto;
  padding: 20px;
}
.title {
  text-align: center;
  font-size: 2.5rem;
  margin-bottom: 30px;
  color: #1f2937;
}

/* Карточки */
.card {
  background: white;
  padding: 20px;
  margin-bottom: 20px;
  border-radius: 15px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

/* Форма */
.form {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
}
.form input,
.form select {
  padding: 10px;
  border-radius: 10px;
  border: 1px solid #ccc;
  outline: none;
  transition: 0.3s;
}
.form input:focus,
.form select:focus {
  border-color: #4f46e5;
  box-shadow: 0 0 5px rgba(79, 70, 229, 0.5);
}

/* Кнопки */
.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-weight: bold;
  transition: 0.3s;
}
.btn:hover {
  transform: scale(1.05);
}
.btn-add {
  background: linear-gradient(to right, #4f46e5, #3b82f6);
  color: white;
}
.btn-delete {
  background: #ef4444;
  color: white;
}
.btn-export {
  background: #22c55e;
  color: white;
}

/* Фильтры */
.filters {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-bottom: 20px;
}
.btn-filter {
  background: #e5e7eb;
  color: #1f2937;
}
.btn-filter-active {
  background: #4f46e5;
  color: white;
}

/* Таблица */
.transactions {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}
.transactions th,
.transactions td {
  padding: 12px;
  border-bottom: 1px solid #ddd;
}
.transactions tr:hover {
  background: #f1f5f9;
}

/* Аналитика */
.analytics span {
  font-weight: bold;
}
.income {
  color: green;
}
.expense {
  color: red;
}
.profit {
  color: blue;
}

/* Файл инпут */
.file-input {
  padding: 8px;
  border-radius: 10px;
  border: 1px solid #ccc;
}

/* Адаптивность */
@media (max-width: 768px) {
  .form input,
  .form select,
  .btn-add {
    width: 100%;
  }
  .transactions th,
  .transactions td {
    padding: 8px;
  }
}
</style>
