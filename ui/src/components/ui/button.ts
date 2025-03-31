import { defineComponent, h } from 'vue';

// 简单的按钮组件
export const Button = defineComponent({
  name: 'Button',
  props: {
    variant: {
      type: String,
      default: 'default'
    },
    size: {
      type: String,
      default: 'default'
    },
    disabled: {
      type: Boolean,
      default: false
    }
  },
  setup(props, { slots }) {
    return () => {
      // 根据variant和size计算class
      const variantClasses = {
        default: 'bg-blue-600 hover:bg-blue-700 text-white',
        outline: 'border border-gray-300 hover:bg-gray-100 text-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800',
        ghost: 'hover:bg-gray-100 text-gray-700 dark:text-gray-300 dark:hover:bg-gray-800',
      };
      
      const sizeClasses = {
        sm: 'px-2 py-1 text-xs',
        default: 'px-4 py-2 text-sm',
        lg: 'px-6 py-3 text-base'
      };
      
      const baseClasses = 'font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed';
      
      const variant = props.variant as keyof typeof variantClasses;
      const size = props.size as keyof typeof sizeClasses;
      
      const classes = `${baseClasses} ${variantClasses[variant] || variantClasses.default} ${sizeClasses[size] || sizeClasses.default}`;
      
      return h('button', {
        class: classes,
        disabled: props.disabled,
      }, slots.default?.());
    };
  }
});

export default Button; 