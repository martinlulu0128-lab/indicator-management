/**
 * 通用过滤函数
 * @param data 要过滤的数据数组
 * @param conditions 过滤条件，可以是函数或条件对象
 * @returns 过滤后的数据数组
 */
export function filter<T>(
  data: T[],
  conditions: { 
    [K in keyof T]?: T[K] | ((value: T[K]) => boolean) | { operator: 'eq' | 'ne' | 'gt' | 'lt' | 'gte' | 'lte' | 'includes' | 'startsWith' | 'endsWith', value: any }
  } | ((item: T) => boolean)
): T[] {
  // 如果conditions是函数，直接使用数组的filter方法
  if (typeof conditions === 'function') {
    return data.filter(conditions);
  }

  // 否则按照字段条件过滤
  return data.filter(item => {
    for (const key in conditions) {
      if (conditions.hasOwnProperty(key)) {
        const conditionValue = conditions[key];
        const itemValue = item[key];

        // 如果条件值是函数，使用函数判断
        if (typeof conditionValue === 'function') {
          if (!conditionValue(itemValue)) {
            return false;
          }
        } 
        // 如果条件值是对象（带操作符）
        else if (typeof conditionValue === 'object' && conditionValue !== null && 'operator' in conditionValue) {
          const { operator, value } = conditionValue as { operator: string, value: any };
          
          switch (operator) {
            case 'eq':
              if (itemValue !== value) return false;
              break;
            case 'ne':
              if (itemValue === value) return false;
              break;
            case 'gt':
              if (typeof itemValue === 'number' && typeof value === 'number' && itemValue <= value) return false;
              break;
            case 'lt':
              if (typeof itemValue === 'number' && typeof value === 'number' && itemValue >= value) return false;
              break;
            case 'gte':
              if (typeof itemValue === 'number' && typeof value === 'number' && itemValue < value) return false;
              break;
            case 'lte':
              if (typeof itemValue === 'number' && typeof value === 'number' && itemValue > value) return false;
              break;
            case 'includes':
              if (typeof itemValue === 'string' && typeof value === 'string' && !itemValue.includes(value)) return false;
              break;
            case 'startsWith':
              if (typeof itemValue === 'string' && typeof value === 'string' && !itemValue.startsWith(value)) return false;
              break;
            case 'endsWith':
              if (typeof itemValue === 'string' && typeof value === 'string' && !itemValue.endsWith(value)) return false;
              break;
            default:
              if (itemValue !== value) return false;
          }
        }
        // 否则直接比较值
        else if (itemValue !== conditionValue) {
          return false;
        }
      }
    }
    return true;
  });
}

/**
 * 过滤掉数组中的空值（undefined, null, 空字符串等）
 * @param data 要过滤的数据数组
 * @returns 过滤后的数据数组
 */
export function filterEmpty<T>(data: T[]): T[] {
  return data.filter(item => {
    // 过滤掉 undefined, null, 空字符串
    if (item === undefined || item === null) return false;
    if (typeof item === 'string' && item.trim() === '') return false;
    if (Array.isArray(item) && item.length === 0) return false;
    if (typeof item === 'object' && item !== null && Object.keys(item).length === 0) return false;
    return true;
  });
}

/**
 * 根据多个条件过滤数据（AND逻辑）
 * @param data 要过滤的数据数组
 * @param conditions 条件数组
 * @returns 过滤后的数据数组
 */
export function filterMultiple<T>(data: T[], conditions: ((item: T) => boolean)[]): T[] {
  return conditions.reduce((result, condition) => result.filter(condition), data);
}

/**
 * 根据多个条件过滤数据（OR逻辑）
 * @param data 要过滤的数据数组
 * @param conditions 条件数组
 * @returns 过滤后的数据数组
 */
export function filterMultipleOr<T>(data: T[], conditions: ((item: T) => boolean)[]): T[] {
  return data.filter(item => conditions.some(condition => condition(item)));
}

export default filter;