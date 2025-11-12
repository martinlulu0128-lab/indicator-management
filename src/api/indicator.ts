// 指标管理相关的API接口模拟

// 获取核心主题表
export function getCoreTables() {
  return Promise.resolve([
    { id: 1, name: 'sales_detail', description: '销售明细表' },
    { id: 2, name: 'user_behavior', description: '用户行为表' },
    { id: 3, name: 'product_info', description: '产品信息表' },
    { id: 4, name: 'order_summary', description: '订单汇总表' },
    { id: 5, name: 'customer_profile', description: '客户画像表' }
  ]);
}

// 获取表字段
export function getTableFields(tableId: number) {
  const fields: Record<number, any[]> = {
    1: [ // 销售明细表字段
      { id: 1, name: '订单ID', type: '维度', tableId: 1 },
      { id: 2, name: '客户ID', type: '维度', tableId: 1 },
      { id: 3, name: '产品ID', type: '维度', tableId: 1 },
      { id: 4, name: '销售金额', type: '指标', tableId: 1 },
      { id: 5, name: '订单数量', type: '指标', tableId: 1 },
      { id: 6, name: '折扣金额', type: '指标', tableId: 1 },
      { id: 7, name: '客户等级', type: '衍生维度', tableId: 1 },
      { id: 8, name: '客单价', type: '衍生指标', tableId: 1 }
    ],
    2: [ // 用户行为表字段
      { id: 9, name: '用户ID', type: '维度', tableId: 2 },
      { id: 10, name: '访问时间', type: '维度', tableId: 2 },
      { id: 11, name: '页面浏览量', type: '指标', tableId: 2 },
      { id: 12, name: '点击次数', type: '指标', tableId: 2 },
      { id: 13, name: '停留时长', type: '指标', tableId: 2 },
      { id: 14, name: '用户类型', type: '衍生维度', tableId: 2 },
      { id: 15, name: '活跃度评分', type: '衍生指标', tableId: 2 }
    ],
    3: [ // 产品信息表字段
      { id: 16, name: '产品ID', type: '维度', tableId: 3 },
      { id: 17, name: '产品名称', type: '维度', tableId: 3 },
      { id: 18, name: '产品类别', type: '维度', tableId: 3 },
      { id: 19, name: '产品价格', type: '指标', tableId: 3 },
      { id: 20, name: '库存数量', type: '指标', tableId: 3 },
      { id: 21, name: '产品状态', type: '衍生维度', tableId: 3 },
      { id: 22, name: '热销指数', type: '衍生指标', tableId: 3 }
    ],
    4: [ // 订单汇总表字段
      { id: 23, name: '订单日期', type: '维度', tableId: 4 },
      { id: 24, name: '订单总额', type: '指标', tableId: 4 },
      { id: 25, name: '订单数量', type: '指标', tableId: 4 },
      { id: 26, name: '客户数量', type: '指标', tableId: 4 },
      { id: 27, name: '平均订单金额', type: '衍生指标', tableId: 4 }
    ],
    5: [ // 客户画像表字段
      { id: 28, name: '客户ID', type: '维度', tableId: 5 },
      { id: 29, name: '客户等级', type: '维度', tableId: 5 },
      { id: 30, name: '消费总额', type: '指标', tableId: 5 },
      { id: 31, name: '购买频次', type: '指标', tableId: 5 },
      { id: 32, name: '最近购买时间', type: '维度', tableId: 5 },
      { id: 33, name: '客户价值评分', type: '衍生指标', tableId: 5 }
    ]
  };

  return Promise.resolve(fields[tableId] || []);
}

// 获取结果数据
export function getResultData() {
  // 模拟数据
  return Promise.resolve({
    data: [
      // 这里可以添加一些模拟数据
    ],
    total: 0
  });
}