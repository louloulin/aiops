<!-- AutohealDashboard.vue -->
<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <h2 class="text-2xl font-bold">Auto-heal System</h2>
      <div class="flex space-x-2">
        <button @click="fetchIncidents" 
                class="rounded-md bg-secondary text-secondary-foreground px-4 py-2">
          Refresh
        </button>
        <button @click="openConfigModal" 
                class="rounded-md bg-primary text-primary-foreground px-4 py-2">
          Configure Rules
        </button>
      </div>
    </div>

    <!-- Active Incidents -->
    <div class="rounded-lg border bg-card">
      <div class="p-4">
        <h3 class="text-lg font-semibold mb-4">Active Incidents</h3>
        <div class="space-y-4">
          <div v-for="incident in activeIncidents" :key="incident.id"
               class="flex items-center justify-between p-4 border rounded-md">
            <div class="space-y-1">
              <div class="font-medium">{{ incident.title }}</div>
              <div class="text-sm text-muted-foreground">{{ incident.service }}</div>
              <div class="text-sm">
                <span :class="{
                  'text-destructive': incident.severity === 'critical',
                  'text-yellow-500': incident.severity === 'warning',
                  'text-blue-500': incident.severity === 'info'
                }">
                  {{ incident.severity.toUpperCase() }}
                </span>
                - {{ incident.status }}
              </div>
            </div>
            <div class="flex items-center space-x-4">
              <button v-if="incident.status === 'detected'"
                      @click="startAutoHeal(incident.id)"
                      class="text-sm bg-primary text-primary-foreground px-3 py-1 rounded-md">
                Start Auto-heal
              </button>
              <button v-if="incident.status === 'healing'"
                      @click="stopAutoHeal(incident.id)"
                      class="text-sm bg-destructive text-destructive-foreground px-3 py-1 rounded-md">
                Stop
              </button>
            </div>
          </div>
          <div v-if="activeIncidents.length === 0" class="text-center text-muted-foreground py-8">
            No active incidents
          </div>
        </div>
      </div>
    </div>

    <!-- Recent Auto-heal Actions -->
    <div class="rounded-lg border bg-card">
      <div class="p-4">
        <h3 class="text-lg font-semibold mb-4">Recent Auto-heal Actions</h3>
        <div class="space-y-4">
          <div v-for="action in recentActions" :key="action.id"
               class="flex items-center justify-between p-4 border rounded-md">
            <div class="space-y-1">
              <div class="font-medium">{{ action.action }}</div>
              <div class="text-sm text-muted-foreground">{{ action.service }}</div>
              <div class="text-sm">
                <span :class="{
                  'text-green-500': action.result === 'success',
                  'text-destructive': action.result === 'failed'
                }">
                  {{ action.result.toUpperCase() }}
                </span>
                - {{ formatDate(action.timestamp) }}
              </div>
            </div>
            <button v-if="action.result === 'failed'"
                    @click="retryAction(action.id)"
                    class="text-sm text-primary hover:underline">
              Retry
            </button>
          </div>
          <div v-if="recentActions.length === 0" class="text-center text-muted-foreground py-8">
            No recent actions
          </div>
        </div>
      </div>
    </div>

    <!-- Configuration Modal -->
    <div v-if="showConfigModal" class="fixed inset-0 bg-background/80 backdrop-blur-sm">
      <div class="fixed inset-x-0 top-16 z-50 w-full max-w-2xl mx-auto p-6 rounded-lg border bg-card shadow-lg">
        <div class="flex justify-between items-center mb-6">
          <h3 class="text-lg font-semibold">Auto-heal Configuration</h3>
          <button @click="showConfigModal = false" class="text-muted-foreground hover:text-foreground">
            ✕
          </button>
        </div>
        <div class="space-y-6">
          <div v-for="(rule, index) in healingRules" :key="index" class="space-y-4 p-4 border rounded-md">
            <div class="flex justify-between items-start">
              <div class="space-y-1">
                <h4 class="font-medium">Rule {{ index + 1 }}</h4>
                <p class="text-sm text-muted-foreground">{{ rule.description }}</p>
              </div>
              <button @click="removeRule(index)" class="text-destructive hover:text-destructive/80">
                Delete
              </button>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-2">
                <label class="text-sm font-medium">Condition</label>
                <select v-model="rule.condition" class="w-full rounded-md border bg-background px-3 py-2">
                  <option value="cpu_high">CPU Usage High</option>
                  <option value="memory_high">Memory Usage High</option>
                  <option value="disk_full">Disk Space Low</option>
                  <option value="service_down">Service Down</option>
                </select>
              </div>
              <div class="space-y-2">
                <label class="text-sm font-medium">Action</label>
                <select v-model="rule.action" class="w-full rounded-md border bg-background px-3 py-2">
                  <option value="restart_service">Restart Service</option>
                  <option value="scale_up">Scale Up</option>
                  <option value="cleanup">Cleanup</option>
                  <option value="notify">Notify Only</option>
                </select>
              </div>
            </div>
            <div class="space-y-2">
              <label class="text-sm font-medium">Threshold</label>
              <input v-model="rule.threshold"
                     type="number"
                     class="w-full rounded-md border bg-background px-3 py-2" />
            </div>
          </div>
          <button @click="addRule" class="w-full rounded-md border border-dashed text-muted-foreground p-4 hover:text-foreground">
            + Add Rule
          </button>
          <div class="flex justify-end space-x-2 mt-6">
            <button @click="showConfigModal = false" class="rounded-md border px-4 py-2">
              Cancel
            </button>
            <button @click="saveRules" class="rounded-md bg-primary text-primary-foreground px-4 py-2">
              Save Configuration
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="error" class="rounded-md bg-destructive/10 text-destructive p-4">
      {{ error }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';

interface Incident {
  id: string;
  title: string;
  service: string;
  severity: 'critical' | 'warning' | 'info';
  status: 'detected' | 'healing' | 'resolved';
  timestamp: string;
}

interface Action {
  id: string;
  action: string;
  service: string;
  result: 'success' | 'failed';
  timestamp: string;
}

interface HealingRule {
  condition: string;
  action: string;
  threshold: number;
  description: string;
}

const activeIncidents = ref<Incident[]>([]);
const recentActions = ref<Action[]>([]);
const healingRules = ref<HealingRule[]>([]);
const error = ref<string | null>(null);
const showConfigModal = ref(false);

const formatDate = (date: string) => {
  return new Date(date).toLocaleString();
};

const fetchIncidents = async () => {
  try {
    error.value = null;
    const [incidentsResponse, actionsResponse] = await Promise.all([
      fetch('http://localhost:3000/api/autoheal/incidents'),
      fetch('http://localhost:3000/api/autoheal/actions')
    ]);

    if (!incidentsResponse.ok || !actionsResponse.ok) {
      throw new Error('Failed to fetch auto-heal data');
    }

    activeIncidents.value = await incidentsResponse.json();
    recentActions.value = await actionsResponse.json();
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'An error occurred';
    console.error('Error fetching auto-heal data:', err);
  }
};

const startAutoHeal = async (id: string) => {
  try {
    error.value = null;
    const response = await fetch(`http://localhost:3000/api/autoheal/incidents/${id}/start`, {
      method: 'POST'
    });

    if (!response.ok) {
      throw new Error('Failed to start auto-heal process');
    }

    await fetchIncidents();
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'An error occurred';
    console.error('Error starting auto-heal:', err);
  }
};

const stopAutoHeal = async (id: string) => {
  try {
    error.value = null;
    const response = await fetch(`http://localhost:3000/api/autoheal/incidents/${id}/stop`, {
      method: 'POST'
    });

    if (!response.ok) {
      throw new Error('Failed to stop auto-heal process');
    }

    await fetchIncidents();
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'An error occurred';
    console.error('Error stopping auto-heal:', err);
  }
};

const retryAction = async (id: string) => {
  try {
    error.value = null;
    const response = await fetch(`http://localhost:3000/api/autoheal/actions/${id}/retry`, {
      method: 'POST'
    });

    if (!response.ok) {
      throw new Error('Failed to retry action');
    }

    await fetchIncidents();
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'An error occurred';
    console.error('Error retrying action:', err);
  }
};

const fetchRules = async () => {
  try {
    error.value = null;
    const response = await fetch('http://localhost:3000/api/autoheal/rules');
    if (!response.ok) {
      throw new Error('Failed to fetch healing rules');
    }
    healingRules.value = await response.json();
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'An error occurred';
    console.error('Error fetching healing rules:', err);
  }
};

const saveRules = async () => {
  try {
    error.value = null;
    const response = await fetch('http://localhost:3000/api/autoheal/rules', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(healingRules.value),
    });

    if (!response.ok) {
      throw new Error('Failed to save healing rules');
    }

    showConfigModal.value = false;
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'An error occurred';
    console.error('Error saving healing rules:', err);
  }
};

const addRule = () => {
  healingRules.value.push({
    condition: 'cpu_high',
    action: 'restart_service',
    threshold: 80,
    description: 'New auto-heal rule',
  });
};

const removeRule = (index: number) => {
  healingRules.value.splice(index, 1);
};

const openConfigModal = () => {
  showConfigModal.value = true;
  fetchRules();
};

onMounted(() => {
  fetchIncidents();
  // Refresh incidents every 30 seconds
  const interval = setInterval(fetchIncidents, 30000);
  onUnmounted(() => clearInterval(interval));
});
</script> 