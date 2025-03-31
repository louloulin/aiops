import { defineComponent, h } from 'vue';

export const Card = defineComponent({
  name: 'Card',
  setup(props, { slots }) {
    return () => h('div', {
      class: 'bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden',
    }, slots.default?.());
  }
});

export const CardHeader = defineComponent({
  name: 'CardHeader',
  setup(props, { slots }) {
    return () => h('div', {
      class: 'px-6 py-4 border-b border-gray-200 dark:border-gray-700',
    }, slots.default?.());
  }
});

export const CardTitle = defineComponent({
  name: 'CardTitle',
  setup(props, { slots }) {
    return () => h('h3', {
      class: 'text-lg font-medium text-gray-900 dark:text-gray-100',
    }, slots.default?.());
  }
});

export const CardDescription = defineComponent({
  name: 'CardDescription',
  setup(props, { slots }) {
    return () => h('p', {
      class: 'text-sm text-gray-500 dark:text-gray-400 mt-1',
    }, slots.default?.());
  }
});

export const CardContent = defineComponent({
  name: 'CardContent',
  setup(props, { slots }) {
    return () => h('div', {
      class: 'px-6 py-4',
    }, slots.default?.());
  }
});

export const CardFooter = defineComponent({
  name: 'CardFooter',
  setup(props, { slots }) {
    return () => h('div', {
      class: 'px-6 py-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-2',
    }, slots.default?.());
  }
});
