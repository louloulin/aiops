import { defineComponent, h } from 'vue';

export const Input = defineComponent({
  name: 'Input',
  props: {
    modelValue: {
      type: [String, Number],
      default: ''
    },
    placeholder: {
      type: String,
      default: ''
    },
    type: {
      type: String,
      default: 'text'
    },
    disabled: {
      type: Boolean,
      default: false
    }
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    return () => h('input', {
      class: 'w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed',
      value: props.modelValue,
      type: props.type,
      placeholder: props.placeholder,
      disabled: props.disabled,
      onInput: (e: Event) => {
        const target = e.target as HTMLInputElement;
        emit('update:modelValue', target.value);
      }
    });
  }
});

export default Input;
