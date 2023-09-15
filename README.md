# vota-operator-scripts
Scripts for Dora Vota round operators.



### 创建Round

https://vota-testnet.dorafactory.org

<img src="http://tomasfeng.oss-rg-china-mainland.aliyuncs.com/2023-09-08-151428.png" alt="image-20230908231427600" style="zoom:50%;" />



<img src="http://tomasfeng.oss-rg-china-mainland.aliyuncs.com/2023-09-08-152326.png" alt="image-20230908232325356" style="zoom:50%;" />

创建round的时候，你需要提供round name和operator的pubkey，你可以通过operator-script生成operator的公私钥。

> 关于cli的内容请跳跃到CLI，以查看详细内容。

```
npm run genOperatorKey
```

output

```json
{
  privKey: '',
  pubKey: [
    '12273057620169189416323782348328909492013399669004533613869445651050930996208',
    '5596177516822309461139290331258776877651294797572801401227318669404428501562'
  ]
}
```



### Operator CLI

Operator CLI是operator生成proof以及和合约交互的工具。

#### 开启前的准备

```bash
git clone https://github.com/DoraFactory/vota-operator-scripts.git
cd vota-operator-scripts/ && npm i && npm install -g snarkjs
npm run build
```

#### 开始 Tally

>以下的操作需要在投票停止之后进行。



下载operator脚本仓库，并进行编译。

```shell
git clone https://github.com/DoraFactory/vota-operator-scripts.git
cd vota-operator-scripts/ && npm i
npm run build
```

准备.env配置文件

```bash
open password.env.txt

# 将相关的信息填写其中
CONTRACT_ADDRESS=<合约地址>
COORDINATOR_KEY=<执行genOperatorKey时，产生的私钥，需要和创建round的pubkey对应>
STATE_SALT=<YOUR_STATE_SALT>
MNEMONIC=<部署合约的账户助记词>
```



```
mv password.env.txt .env
```

#### 

**开始Operator Tally**

**1. prepare operator round data**

开启processing环节，并获取链上signup和publishmessage的数据，以及生成proof。

```bash
npm run prepareOperator
```

**2. Process message**

将msg proof和commitment按顺序上传到链上

```
npm run processMessage
```

**3. Stop process period**

关闭processing环节，进入tallying环节。

```
npm run stopProcessing
```

**4. Process tally**

将tally proof和commitment按顺序上传到链上。

```
npm run processTally
```

**5. Stop Tally**

关闭tally环节，并将result上传到链上。整轮round到此结束！

```
npm run stopTallying
```

#### Other CLI Command

**Set Round Info**

```
npm run setRoundInfo
```



