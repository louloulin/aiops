<!-- MainLayout.vue -->
<template>
  <div class="min-h-screen bg-background">
    <header class="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div class="container flex h-14 items-center">
        <div class="mr-4 flex">
          <a class="mr-6 flex items-center space-x-2" href="/">
            <span class="font-bold">AI OPS</span>
          </a>
        </div>
        <nav class="flex items-center space-x-6 text-sm font-medium">
          <a href="/metrics" class="transition-colors hover:text-foreground/80">Metrics</a>
          <a href="/logs" class="transition-colors hover:text-foreground/80">Logs</a>
          <a href="/deploy" class="transition-colors hover:text-foreground/80">Deploy</a>
          <a href="/knowledge" class="transition-colors hover:text-foreground/80">Knowledge</a>
          <a href="/autoheal" class="transition-colors hover:text-foreground/80">Auto-heal</a>
        </nav>
      </div>
    </header>
    <main class="container py-6">
      <slot></slot>
    </main>
  </div>
</template>

<script setup lang="ts">
// Component logic here
</script> 