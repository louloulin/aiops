#!/bin/bash

API_URL="http://localhost:9700/api"

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}开始测试API端点...${NC}"

# 测试健康检查
echo -e "\n${YELLOW}1. 测试健康检查 GET ${API_URL}/health${NC}"
curl -s "${API_URL}/health" | jq

# 测试生成模拟数据
echo -e "\n${YELLOW}2. 生成模拟数据 POST ${API_URL}/metrics/system/mock${NC}"
curl -s -X POST "${API_URL}/metrics/system/mock" \
  -H "Content-Type: application/json" \
  -d '{"count": 5, "variation": 0.2}' | jq

sleep 2

# 测试获取系统指标
echo -e "\n${YELLOW}3. 获取系统指标 GET ${API_URL}/metrics/system?limit=3${NC}"
curl -s "${API_URL}/metrics/system?limit=3" | jq

# 测试分析系统指标
echo -e "\n${YELLOW}4. 分析系统指标 GET ${API_URL}/metrics/system/analyze${NC}"
curl -s "${API_URL}/metrics/system/analyze" | jq

echo -e "\n${GREEN}测试完成!${NC}" 