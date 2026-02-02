<script setup>
import { computed } from 'vue';

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  label: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: ''
  },
  rows: {
    type: Number,
    default: 3
  },
  required: {
    type: Boolean,
    default: false
  },
  disabled: {
    type: Boolean,
    default: false
  },
  readonly: {
    type: Boolean,
    default: false
  },
  error: {
    type: String,
    default: ''
  },
  hint: {
    type: String,
    default: ''
  },
  maxlength: {
    type: Number,
    default: undefined
  },
  showCount: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:modelValue', 'blur', 'focus']);

const textareaId = computed(() => `textarea-${Math.random().toString(36).substr(2, 9)}`);

const textareaClasses = computed(() => [
  'w-full px-4 py-2 border rounded-lg transition-colors resize-none',
  'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
  props.error ? 'border-red-500 bg-red-50' : 'border-gray-300',
  props.disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white',
  props.readonly ? 'bg-gray-50' : ''
]);

const charCount = computed(() => {
  return props.modelValue?.length || 0;
});
</script>

<template>
  <div class="form-textarea-wrapper">
    <label v-if="label" :for="textareaId" class="block text-sm font-medium text-gray-700 mb-1">
      {{ label }}
      <span v-if="required" class="text-red-500">*</span>
    </label>

    <textarea
      :id="textareaId"
      :value="modelValue"
      :placeholder="placeholder"
      :rows="rows"
      :required="required"
      :disabled="disabled"
      :readonly="readonly"
      :maxlength="maxlength"
      :class="textareaClasses"
      @input="$emit('update:modelValue', $event.target.value)"
      @blur="$emit('blur', $event)"
      @focus="$emit('focus', $event)"
    ></textarea>

    <div class="flex justify-between mt-1">
      <div>
        <p v-if="error" class="text-sm text-red-600">
          {{ error }}
        </p>
        <p v-else-if="hint" class="text-sm text-gray-500">
          {{ hint }}
        </p>
      </div>
      <p v-if="showCount && maxlength" class="text-sm text-gray-500">
        {{ charCount }}/{{ maxlength }}
      </p>
    </div>
  </div>
</template>
