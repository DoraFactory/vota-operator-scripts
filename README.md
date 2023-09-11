# vota-operator-scripts
Scripts for Dora Vota round operators.

### 前沿准备

```shell
git clone https://github.com/DoraFactory/vota-operator-scripts.git
cd vota-operator-scripts/ && yarn
yarn build
```

### 如何创建Round

https://vota-testnet.dorafactory.org

<img src="http://tomasfeng.oss-rg-china-mainland.aliyuncs.com/2023-09-08-151428.png" alt="image-20230908231427600" style="zoom:50%;" />



<img src="http://tomasfeng.oss-rg-china-mainland.aliyuncs.com/2023-09-08-152326.png" alt="image-20230908232325356" style="zoom:50%;" />

创建round的时候，你需要提供round name和operator的pubkey，你可以通过operator-script生成operator的公私钥。

```
yarn genOperatorKey
```

output

```
{
  privKey: '',
  pubKey: [
    '12273057620169189416323782348328909492013399669004533613869445651050930996208',
    '5596177516822309461139290331258776877651294797572801401227318669404428501562'
  ],
  formatedPrivKey: ''
}
```



### Get Start

以下的操作需要在投票停止之后进行。

![image-20230908204222123](http://tomasfeng.oss-rg-china-mainland.aliyuncs.com/2023-09-08-142336.png)

下载operator脚本仓库，并进行编译。

```shell
git clone https://github.com/DoraFactory/vota-operator-scripts.git
cd vota-operator-scripts/ && yarn
yarn build
```


准备.env配置文件

```
cp .env.template .env
```



```
# operator.sh env
CONTRACT_ADDRESS=<合约地址>
COORDINATOR_KEY=<部署合约时设置的operator的私钥>
STATE_SALT=<YOUR_STATE_SALT>
MNEMONIC=admin账户（部署合约的账户助记词）

```



**About `COORDINATOR_KEY`**

> We provide methods for locally generating Operator public and private keys, by which you can randomly generate a key.

```bash
yarn genOperatorKey
```



**1. Start processing**

```bash
yarn startProcess
```



**2. Get your proof**

```
yarn genProof
```





**3. Process message**

```
yarn processMessage
```





**4. Stop process period**

```
yarn stopProcessing
```





**5. Process tally**

```
yarn processTally
```





**6. Stop Tally**

```
yarn stopTallying
```

