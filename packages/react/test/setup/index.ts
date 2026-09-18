// RTL 要求：jsdom 下显式声明 React act 环境
;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

// v2 契约：测试环境下 randomId 返回空串（快照稳定）
process.env.NODE_ENV = 'test'
