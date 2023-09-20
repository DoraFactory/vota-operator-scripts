# #!/bin/bash

# # .env文件的路径
# env_file=".env"

# # 使用grep命令来提取CONTRACT_ADDRESS的内容
# if [ -f "$env_file" ]; then
#     contract_address=$(grep "^CONTRACT_ADDRESS=" "$env_file" | cut -d "=" -f 2)
#     if [ -n "$contract_address" ]; then
#         echo "CONTRACT_ADDRESS 的内容为: $contract_address"
#     else
#         echo "未找到 CONTRACT_ADDRESS。"
#     fi
# else
#     echo ".env 文件不存在或不可读取。"
# fi

#!/bin/bash

env_file=".env"

if [ -f "$env_file" ]; then
    source "$env_file"
    
    echo "CONTRACT_ADDRESS: $CONTRACT_ADDRESS"
    echo "COORDINATOR_KEY: $COORDINATOR_KEY"
    echo "STATE_SALT: $STATE_SALT"
else
    echo ".env 文件不存在或不可读取。"
fi
