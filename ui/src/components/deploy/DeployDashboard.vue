<!-- DeployDashboard.vue -->
<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <h2 class="text-2xl font-bold">Deployment Management</h2>
      <button @click="openDeployModal" class="rounded-md bg-primary text-primary-foreground px-4 py-2">
        New Deployment
      </button>
    </div>

    <!-- Deployments List -->
    <div class="rounded-lg border bg-card">
      <div class="p-4">
        <h3 class="text-lg font-semibold mb-4">Recent Deployments</h3>
        <div class="space-y-4">
          <div v-for="deployment in deployments" :key="deployment.id" 
               class="flex items-center justify-between p-4 border rounded-md">
            <div class="space-y-1">
              <div class="font-medium">{{ deployment.name }}</div>
              <div class="text-sm text-muted-foreground">{{ deployment.environment }}</div>
            </div>
            <div class="flex items-center space-x-4">
              <span :class="{
                'text-green-500': deployment.status === 'success',
                'text-yellow-500': deployment.status === 'in_progress',
                'text-destructive': deployment.status === 'failed'
              }">
                {{ deployment.status }}
              </span>
              <button v-if="deployment.status === 'failed'"
                      @click="retryDeployment(deployment.id)"
                      class="text-sm text-primary hover:underline">
                Retry
              </button>
              <button v-if="deployment.status === 'success'"
                      @click="rollbackDeployment(deployment.id)"
                      class="text-sm text-destructive hover:underline">
                Rollback
              </button>
            </div>
          </div>
          <div v-if="deployments.length === 0" class="text-center text-muted-foreground py-8">
            No deployments found
          </div>
        </div>
      </div>
    </div>

    <!-- Deployment Modal -->
    <div v-if="showDeployModal" class="fixed inset-0 bg-background/80 backdrop-blur-sm">
      <div class="fixed inset-x-0 top-1/4 z-50 w-full max-w-lg mx-auto p-6 rounded-lg border bg-card shadow-lg">
        <h3 class="text-lg font-semibold mb-4">New Deployment</h3>
        <form @submit.prevent="submitDeployment" class="space-y-4">
          <div class="space-y-2">
            <label class="text-sm font-medium">Name</label>
            <input v-model="newDeployment.name" 
                   type="text" 
                   class="w-full rounded-md border bg-background px-3 py-2" 
                   required />
          </div>
          <div class="space-y-2">
            <label class="text-sm font-medium">Environment</label>
            <select v-model="newDeployment.environment" 
                    class="w-full rounded-md border bg-background px-3 py-2"
                    required>
              <option value="development">Development</option>
              <option value="staging">Staging</option>
              <option value="production">Production</option>
            </select>
          </div>
          <div class="space-y-2">
            <label class="text-sm font-medium">Version</label>
            <input v-model="newDeployment.version" 
                   type="text" 
                   class="w-full rounded-md border bg-background px-3 py-2"
                   required />
          </div>
          <div class="flex justify-end space-x-2 mt-6">
            <button type="button" 
                    @click="showDeployModal = false"
                    class="rounded-md border px-4 py-2">
              Cancel
            </button>
            <button type="submit" 
                    class="rounded-md bg-primary text-primary-foreground px-4 py-2">
              Deploy
            </button>
          </div>
        </form>
      </div>
    </div>

    <div v-if="error" class="rounded-md bg-destructive/10 text-destructive p-4">
      {{ error }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

interface Deployment {
  id: string;
  name: string;
  environment: 'development' | 'staging' | 'production';
  status: 'success' | 'failed' | 'in_progress';
  version: string;
  timestamp: string;
}

interface NewDeployment {
  name: string;
  environment: 'development' | 'staging' | 'production';
  version: string;
}

const deployments = ref<Deployment[]>([]);
const error = ref<string | null>(null);
const showDeployModal = ref(false);
const newDeployment = ref<NewDeployment>({
  name: '',
  environment: 'development',
  version: '',
});

const fetchDeployments = async () => {
  try {
    error.value = null;
    const response = await fetch('http://localhost:3000/api/deploy');
    if (!response.ok) {
      throw new Error('Failed to fetch deployments');
    }
    deployments.value = await response.json();
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'An error occurred';
    console.error('Error fetching deployments:', err);
  }
};

const submitDeployment = async () => {
  try {
    error.value = null;
    const response = await fetch('http://localhost:3000/api/deploy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newDeployment.value),
    });

    if (!response.ok) {
      throw new Error('Failed to create deployment');
    }

    showDeployModal.value = false;
    await fetchDeployments();
    newDeployment.value = {
      name: '',
      environment: 'development',
      version: '',
    };
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'An error occurred';
    console.error('Error creating deployment:', err);
  }
};

const retryDeployment = async (id: string) => {
  try {
    error.value = null;
    const response = await fetch(`http://localhost:3000/api/deploy/${id}/retry`, {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error('Failed to retry deployment');
    }

    await fetchDeployments();
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'An error occurred';
    console.error('Error retrying deployment:', err);
  }
};

const rollbackDeployment = async (id: string) => {
  try {
    error.value = null;
    const response = await fetch(`http://localhost:3000/api/deploy/${id}/rollback`, {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error('Failed to rollback deployment');
    }

    await fetchDeployments();
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'An error occurred';
    console.error('Error rolling back deployment:', err);
  }
};

const openDeployModal = () => {
  showDeployModal.value = true;
};

onMounted(() => {
  fetchDeployments();
});
</script> 