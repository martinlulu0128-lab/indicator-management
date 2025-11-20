// 测试公式类型自动识别功能
const getFormulaType = (formula) => {
  if (!formula || formula.trim() === '') {
    return 'native' // 空公式默认为原生指标
  }
  
  // 清理公式，移除空格和换行
  const cleanFormula = formula.replace(/\s+/g, '')
  
  // 检测是否为单个字段引用（原生指标）
  // 单个字段引用格式：[表名.字段名]
  const singleFieldPattern = /^\[[^\]]+\.[^\]]+\]$/
  
  if (singleFieldPattern.test(cleanFormula)) {
    return 'native'
  }
  
  // 检测是否包含多个字段引用
  const fieldReferences = cleanFormula.match(/\[[^\]]+\.[^\]]+\]/g) || []
  if (fieldReferences.length > 1) {
    return 'derived'
  }
  
  // 检测是否包含运算符（+、-、*、/）
  const operators = ['+', '-', '*', '/']
  const hasOperator = operators.some(op => cleanFormula.includes(op))
  if (hasOperator) {
    return 'derived'
  }
  
  // 检测是否包含函数调用（函数名后跟括号）
  const functionPattern = /[A-Z]+\s*\(/
  if (functionPattern.test(cleanFormula)) {
    return 'derived'
  }
  
  // 检测是否包含过滤条件（WHERE函数或其他条件表达式）
  const conditionPatterns = [
    /WHERE\s*\(/,  // WHERE函数
    />=/,           // 大于等于
    /<=/,           // 小于等于
    />/,            // 大于
    /</,            // 小于
    /=/,            // 等于
    /!=/            // 不等于
  ]
  
  const hasCondition = conditionPatterns.some(pattern => pattern.test(cleanFormula))
  if (hasCondition) {
    return 'derived'
  }
  
  // 默认情况下，如果公式不是单个字段引用，则认为是衍生指标
  return fieldReferences.length === 1 ? 'native' : 'derived'
}

// 测试用例
const testCases = [
  // 原生指标测试用例
  { formula: 'sales_amount', expected: 'native', description: '单个字段引用' },
  { formula: 'customer_id', expected: 'native', description: '客户ID字段' },
  { formula: 'revenue_amount', expected: 'native', description: '收入金额字段' },
  
  // 衍生指标测试用例
  { formula: 'COUNT(order_id) / COUNT(visitor_id)', expected: 'derived', description: '基础转化率公式' },
  { formula: 'IF(COUNT(visitor_id) > 0, COUNT(order_id) / COUNT(visitor_id), 0)', expected: 'derived', description: '带条件判断的转化率公式' },
  { formula: 'SUM(sales_amount) / COUNT(DISTINCT customer_id)', expected: 'derived', description: '基础客单价公式' },
  { formula: 'revenue_amount - cost_amount', expected: 'derived', description: '利润计算公式' },
  
  // 边界测试用例
  { formula: '', expected: 'native', description: '空公式' },
  { formula: '   ', expected: 'native', description: '空白公式' },
  
  // 复杂衍生指标测试用例
  { formula: 'SUM(sales_amount) WHERE(region = "华东")', expected: 'derived', description: '带WHERE函数的公式' },
  { formula: 'AVG(price) * quantity', expected: 'derived', description: '包含运算符的公式' },
  { formula: 'MAX(revenue_amount) - MIN(cost_amount)', expected: 'derived', description: '复杂函数组合' }
]

// 运行测试
console.log('=== 公式类型自动识别功能测试 ===\n')

let passed = 0
let failed = 0

testCases.forEach((testCase, index) => {
  const result = getFormulaType(testCase.formula)
  const isPassed = result === testCase.expected
  
  if (isPassed) {
    passed++
    console.log(`✅ 测试用例 ${index + 1}: ${testCase.description}`)
    console.log(`   公式: "${testCase.formula}"`)
    console.log(`   预期: ${testCase.expected}, 实际: ${result}`)
  } else {
    failed++
    console.log(`❌ 测试用例 ${index + 1}: ${testCase.description}`)
    console.log(`   公式: "${testCase.formula}"`)
    console.log(`   预期: ${testCase.expected}, 实际: ${result}`)
  }
  console.log('')
})

console.log(`=== 测试结果: ${passed} 通过, ${failed} 失败 ===`)

// 测试实际示例数据中的公式
console.log('\n=== 实际示例数据测试 ===\n')
const actualFormulas = [
  { formula: 'sales_amount', description: '销售金额字段' },
  { formula: 'COUNT(order_id) / COUNT(visitor_id)', description: '基础转化率公式' },
  { formula: 'customer_id', description: '客户ID字段' },
  { formula: 'SUM(sales_amount) / COUNT(DISTINCT customer_id)', description: '基础客单价公式' },
  { formula: 'revenue_amount', description: '收入金额字段' },
  { formula: 'revenue_amount - cost_amount', description: '利润计算公式' }
]

actualFormulas.forEach(item => {
  const result = getFormulaType(item.formula)
  const typeText = result === 'native' ? '原生指标' : '衍生指标'
  console.log(`公式: "${item.formula}"`)
  console.log(`描述: ${item.description}`)
  console.log(`类型: ${typeText}`)
  console.log('')
})