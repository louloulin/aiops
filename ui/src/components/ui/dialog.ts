import { defineComponent, h, ref, Teleport, watch } from 'vue';

export const Dialog = defineComponent({
  name: 'Dialog',
  props: {
    open: {
      type: Boolean,
      default: false
    }
  },
  emits: ['update:open'],
  setup(props, { slots, emit }) {
    const isOpen = ref(props.open);
    
    watch(() => props.open, (newValue) => {
      isOpen.value = newValue;
    });
    
    const close = () => {
      isOpen.value = false;
      emit('update:open', false);
    };
    
    return () => {
      if (!isOpen.value) return null;
      
      return h(Teleport, { to: 'body' }, [
        // 背景遮罩
        h('div', {
          class: 'fixed inset-0 bg-black bg-opacity-50 z-40',
          onClick: close
        }),
        // 弹窗内容容器
        h('div', {
          class: 'fixed inset-0 flex items-center justify-center z-50 p-4'
        }, slots.default?.({ close }))
      ]);
    };
  }
});

export const DialogTrigger = defineComponent({
  name: 'DialogTrigger',
  setup(props, { slots }) {
    return () => h('div', {}, slots.default?.());
  }
});

export const DialogContent = defineComponent({
  name: 'DialogContent',
  props: {
    class: {
      type: String,
      default: ''
    }
  },
  setup(props, { slots }) {
    return () => h('div', {
      class: `bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md max-h-[85vh] overflow-auto ${props.class}`,
      onClick: (e: Event) => {
        e.stopPropagation();
      }
    }, slots.default?.());
  }
});

export const DialogHeader = defineComponent({
  name: 'DialogHeader',
  setup(props, { slots }) {
    return () => h('div', {
      class: 'px-6 py-4 border-b border-gray-200 dark:border-gray-700'
    }, slots.default?.());
  }
});

export const DialogTitle = defineComponent({
  name: 'DialogTitle',
  setup(props, { slots }) {
    return () => h('h2', {
      class: 'text-xl font-semibold text-gray-900 dark:text-gray-100'
    }, slots.default?.());
  }
});

export const DialogDescription = defineComponent({
  name: 'DialogDescription',
  setup(props, { slots }) {
    return () => h('p', {
      class: 'mt-2 text-sm text-gray-500 dark:text-gray-400'
    }, slots.default?.());
  }
});

export const DialogFooter = defineComponent({
  name: 'DialogFooter',
  setup(props, { slots }) {
    return () => h('div', {
      class: 'px-6 py-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-2'
    }, slots.default?.());
  }
}); 