<template>
  <div class="app">
    <!-- LOGIN -->
    <div v-if="!currentUser" class="login">
      <h1>CRM</h1>
      <input v-model="login" placeholder="Login" />
      <input v-model="password" type="password" placeholder="Password" />
      <button @click="handleLogin">Login</button>
    </div>

    <div v-else class="layout">
      <!-- SIDEBAR -->
      <aside class="sidebar">
        <h2>CRM</h2>
        <button @click="view = 'pipeline'">Pipeline</button>
        <button @click="view = 'contacts'">Contacts</button>
        <button @click="view = 'tasks'">Tasks</button>
        <button @click="view = 'analytics'">Analytics</button>
        <button @click="logout">Logout</button>
      </aside>

      <!-- MAIN -->
      <div class="content">
        <!-- PIPELINE -->
        <div v-if="view === 'pipeline'" class="pipeline">
          <div
            v-for="stage in stages"
            :key="stage"
            class="column"
            @dragover.prevent
            @drop="onDrop(stage)"
          >
            <h3>{{ stage }}</h3>

            <div
              v-for="deal in deals.filter((d) => d.stage === stage)"
              :key="deal.id"
              class="card"
              draggable="true"
              @dragstart="onDrag(deal)"
              @click="openDeal(deal)"
            >
              <strong>{{ deal.title }}</strong>
              <p>{{ deal.amount }} €</p>
              <small>{{ getContactName(deal.contactId) }}</small>
            </div>

            <button @click="addDeal(stage)">+ Deal</button>
          </div>
        </div>

        <!-- CONTACTS -->
        <div v-if="view === 'contacts'" class="panel">
          <h2>Clients</h2>
          <input v-model="newContact.name" placeholder="Name" />
          <input v-model="newContact.phone" placeholder="Phone" />
          <button @click="addContact">Add</button>

          <ul>
            <li v-for="c in contacts" :key="c.id">
              {{ c.name }} - {{ c.phone }}
              <button @click="deleteContact(c.id)">❌</button>
            </li>
          </ul>
        </div>

        <!-- TASKS -->
        <div v-if="view === 'tasks'" class="panel">
          <h2>Tasks</h2>
          <input v-model="newTask.text" placeholder="Task" />
          <select v-model="newTask.dealId">
            <option disabled value="">Select Deal</option>
            <option v-for="d in deals" :key="d.id" :value="d.id">
              {{ d.title }}
            </option>
          </select>
          <button @click="addTask">Add</button>

          <ul>
            <li v-for="t in tasks" :key="t.id">
              {{ t.text }} ({{ getDealName(t.dealId) }})
              <button @click="deleteTask(t.id)">❌</button>
            </li>
          </ul>
        </div>

        <!-- ANALYTICS -->
        <div v-if="view === 'analytics'" class="panel">
          <h2>Analytics</h2>
          <canvas ref="chartRef"></canvas>
        </div>
      </div>

      <!-- RIGHT PANEL -->
      <div v-if="selectedDeal" class="right-panel">
        <h3>Deal</h3>
        <input v-model="selectedDeal.title" />
        <input v-model.number="selectedDeal.amount" />

        <select v-model="selectedDeal.stage">
          <option v-for="s in stages" :key="s">{{ s }}</option>
        </select>

        <select v-model="selectedDeal.contactId">
          <option disabled value="">Select Contact</option>
          <option v-for="c in contacts" :key="c.id" :value="c.id">
            {{ c.name }}
          </option>
        </select>

        <button @click="saveDeal">Save</button>
        <button @click="deleteDeal(selectedDeal.id)">Delete</button>
        <button @click="selectedDeal = null">Close</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from "vue";
import Chart from "chart.js/auto";

const login = ref("");
const password = ref("");
const currentUser = ref<any>(null);
const view = ref("pipeline");

const users = [
  { login: "user", password: "user123" },
  { login: "admin", password: "admin123" },
  { login: "manager", password: "manager123" },
];

function handleLogin() {
  const u = users.find(
    (x) => x.login === login.value && x.password === password.value,
  );
  if (u) currentUser.value = u;
}
function logout() {
  currentUser.value = null;
}

// DATA
const deals = ref<any[]>([]);
const contacts = ref<any[]>([]);
const tasks = ref<any[]>([]);

// PIPELINE
const stages = ["New", "In Progress", "Done"];
const dragged = ref<any>(null);

function addDeal(stage: string) {
  deals.value.push({
    id: Date.now(),
    title: "Deal",
    amount: 100,
    stage,
    contactId: "",
  });
}
function onDrag(d: any) {
  dragged.value = d;
}
function onDrop(stage: string) {
  if (dragged.value) dragged.value.stage = stage;
}

// CONTACTS
const newContact = ref({ name: "", phone: "" });
function addContact() {
  contacts.value.push({ id: Date.now(), ...newContact.value });
}
function deleteContact(id: number) {
  contacts.value = contacts.value.filter((c) => c.id !== id);
}

// TASKS
const newTask = ref({ text: "", dealId: "" });
function addTask() {
  tasks.value.push({ id: Date.now(), ...newTask.value });
}
function deleteTask(id: number) {
  tasks.value = tasks.value.filter((t) => t.id !== id);
}

// DEAL PANEL
const selectedDeal = ref<any>(null);
function openDeal(d: any) {
  selectedDeal.value = { ...d };
}
function saveDeal() {
  const i = deals.value.findIndex((x) => x.id === selectedDeal.value.id);
  if (i !== -1) deals.value[i] = selectedDeal.value;
  selectedDeal.value = null;
}
function deleteDeal(id: number) {
  deals.value = deals.value.filter((d) => d.id !== id);
  selectedDeal.value = null;
}

// HELPERS
function getContactName(id: any) {
  return contacts.value.find((c) => c.id === id)?.name || "";
}
function getDealName(id: any) {
  return deals.value.find((d) => d.id === id)?.title || "";
}

// CHART
const chartRef = ref<HTMLCanvasElement | null>(null);
let chartInstance: any = null;
const totalIncome = computed(() =>
  deals.value.reduce((s, d) => s + d.amount, 0),
);

function renderChart() {
  if (!chartRef.value) return;

  if (chartInstance) {
    chartInstance.destroy();
  }

  chartInstance = new Chart(chartRef.value, {
    type: "bar",
    data: {
      labels: stages,
      datasets: [
        {
          label: "Revenue",
          data: stages.map((s) =>
            deals.value
              .filter((d) => d.stage === s)
              .reduce((sum, d) => sum + d.amount, 0),
          ),
        },
      ],
    },
  });
}

watch(view, async (v) => {
  if (v === "analytics") {
    await nextTick();
    renderChart();
  }
});

watch(
  deals,
  () => {
    if (view.value === "analytics") renderChart();
  },
  { deep: true },
);
</script>

<style scoped>
.app {
  height: 100vh;
  font-family: Arial;
}
.login {
  margin: auto;
  width: 300px;
  margin-top: 100px;
  display: flex;
  flex-direction: column;
}
.layout {
  display: flex;
  height: 100%;
}
.sidebar {
  width: 200px;
  background: #0f172a;
  color: #fff;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.content {
  flex: 1;
  padding: 20px;
  background: #f1f5f9;
  display: flex;
}
.pipeline {
  display: flex;
  gap: 20px;
  flex: 1;
}
.column {
  background: #e2e8f0;
  padding: 10px;
  width: 250px;
  border-radius: 10px;
}
.card {
  background: #fff;
  padding: 10px;
  margin: 10px 0;
  border-radius: 8px;
  cursor: pointer;
}
.panel {
  width: 100%;
}
.right-panel {
  width: 300px;
  background: #fff;
  padding: 20px;
  border-left: 1px solid #ddd;
}
input,
select,
button {
  margin: 5px 0;
  padding: 8px;
  border-radius: 6px;
  border: 1px solid #ccc;
}
button {
  cursor: pointer;
}
</style>
