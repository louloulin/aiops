import { defineComponent, h, ref, watch, Teleport, onMounted, onUnmounted } from 'vue';

export const Select = defineComponent({
  name: 'Select',
  props: {
    modelValue: {
      type: [String, Number, Array],
      default: ''
    },
    disabled: {
      type: Boolean,
      default: false
    }
  },
  emits: ['update:modelValue'],
  setup(props, { slots, emit }) {
    // 管理选中值
    const selectedValue = ref(props.modelValue);
    
    watch(() => props.modelValue, (newValue) => {
      selectedValue.value = newValue;
    });
    
    // 更新选中值的方法
    const updateValue = (value: any) => {
      selectedValue.value = value;
      emit('update:modelValue', value);
    };
    
    // 向子组件提供的上下文
    const provideSelectContext = {
      selectedValue,
      updateValue
    };
    
    return () => {
      return h('div', {
        class: 'relative'
      }, slots.default?.({ context: provideSelectContext }));
    };
  }
});

export const SelectTrigger = defineComponent({
  name: 'SelectTrigger',
  props: {
    class: {
      type: String,
      default: ''
    }
  },
  setup(props, { slots }) {
    const isOpen = ref(false);
    
    // 切换下拉菜单状态
    const toggleDropdown = () => {
      isOpen.value = !isOpen.value;
    };
    
    return () => {
      return h('button', {
        type: 'button',
        class: `flex items-center justify-between w-full px-3 py-2 text-sm rounded-md border border-gray-300 shadow-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white ${props.class}`,
        onClick: toggleDropdown
      }, [
        slots.default?.(),
        h('svg', {
          xmlns: 'http://www.w3.org/2000/svg',
          class: 'h-4 w-4 ml-2',
          viewBox: '0 0 20 20',
          fill: 'currentColor'
        }, [
          h('path', {
            'fill-rule': 'evenodd',
            d: 'M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z',
            'clip-rule': 'evenodd'
          })
        ])
      ]);
    };
  }
});

export const SelectValue = defineComponent({
  name: 'SelectValue',
  props: {
    placeholder: {
      type: String,
      default: '选择...'
    }
  },
  setup(props) {
    return () => {
      return h('span', {
        class: 'text-sm text-gray-700 dark:text-gray-300'
      }, props.placeholder);
    };
  }
});

export const SelectContent = defineComponent({
  name: 'SelectContent',
  setup(props, { slots }) {
    return () => {
      return h('div', {
        class: 'absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 shadow-lg rounded-md overflow-hidden py-1 text-sm'
      }, slots.default?.());
    };
  }
});

export const SelectItem = defineComponent({
  name: 'SelectItem',
  props: {
    value: {
      type: [String, Number],
      required: true
    }
  },
  setup(props, { slots }) {
    const isSelected = ref(false);
    
    return () => {
      return h('div', {
        class: [
          'px-3 py-2 cursor-pointer flex items-center',
          isSelected.value 
            ? 'bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100' 
            : 'hover:bg-gray-100 dark:hover:bg-gray-700'
        ],
        onClick: () => {
          // 在实际应用中，这里会更新 Select 的值
        }
      }, slots.default?.());
    };
  }
});
