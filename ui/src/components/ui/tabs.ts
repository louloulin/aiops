import { defineComponent, h, ref, watch, provide, inject, onMounted } from 'vue';
import type { InjectionKey } from 'vue';

type TabsContext = {
  selectedTab: any;
  selectTab: (value: any) => void;
};

const TabsContextKey = Symbol('TabsContext') as InjectionKey<TabsContext>;

export const Tabs = defineComponent({
  name: 'Tabs',
  props: {
    modelValue: {
      type: [String, Number],
      required: true
    },
    defaultValue: {
      type: [String, Number],
      default: null
    }
  },
  emits: ['update:modelValue'],
  setup(props, { slots, emit }) {
    const selectedTab = ref(props.modelValue || props.defaultValue);
    
    watch(() => props.modelValue, (newValue) => {
      selectedTab.value = newValue;
    });
    
    const selectTab = (value: any) => {
      selectedTab.value = value;
      emit('update:modelValue', value);
    };
    
    provide(TabsContextKey, {
      selectedTab,
      selectTab
    });
    
    return () => h('div', {
      class: 'space-y-4'
    }, slots.default?.());
  }
});

export const TabsList = defineComponent({
  name: 'TabsList',
  setup(props, { slots }) {
    return () => h('div', {
      class: 'inline-flex p-1 bg-gray-100 rounded-md dark:bg-gray-800'
    }, slots.default?.());
  }
});

export const TabsTrigger = defineComponent({
  name: 'TabsTrigger',
  props: {
    value: {
      type: [String, Number],
      required: true
    },
    disabled: {
      type: Boolean,
      default: false
    }
  },
  setup(props, { slots }) {
    const tabsContext = inject(TabsContextKey);
    
    if (!tabsContext) {
      throw new Error('TabsTrigger must be used within a Tabs component');
    }
    
    const { selectedTab, selectTab } = tabsContext;
    
    const isActive = () => selectedTab.value === props.value;
    
    return () => h('button', {
      type: 'button',
      class: [
        'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
        isActive() 
          ? 'bg-white shadow dark:bg-gray-700 text-gray-900 dark:text-white' 
          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white',
        props.disabled && 'opacity-50 cursor-not-allowed'
      ],
      disabled: props.disabled,
      onClick: () => !props.disabled && selectTab(props.value)
    }, slots.default?.());
  }
});

export const TabsContent = defineComponent({
  name: 'TabsContent',
  props: {
    value: {
      type: [String, Number],
      required: true
    }
  },
  setup(props, { slots }) {
    const tabsContext = inject(TabsContextKey);
    
    if (!tabsContext) {
      throw new Error('TabsContent must be used within a Tabs component');
    }
    
    const { selectedTab } = tabsContext;
    
    const isActive = () => selectedTab.value === props.value;
    
    return () => {
      if (!isActive()) return null;
      
      return h('div', {
        class: 'rounded-md'
      }, slots.default?.());
    };
  }
});
