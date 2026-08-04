---
title: "富豪的スケーリングの時代の終わりと、アーキテクチャの復権"
description: "Kimi K3とDeepSeek V4は、計算資源を積むだけのスケーリングから、アーキテクチャ、kernel、分散システムを共同設計するスケーリングへの移行を示している。"
date: "2026-08-04"
tags: [AI, LLM, Transformer, スケーリング, 分散システム]
---

「富豪的スケーリングの時代は終わった」のではないか。

Kimi K3とDeepSeek V4を見ると、Attentionだけでなく、FFNの使い方、層のつなぎ方、学習時の重み更新、低精度化、GPU間通信まで変わっている。
GPT-2のようなdecoder-only Transformerをほぼ固定し、パラメータ、データ、GPUを増やしてきた時代とは、研究の風景が明らかに違う。

一方で、両モデルの規模は小さくなっていない。
Kimi K3は2.8Tパラメータを持ち、DeepSeek V4は32T tokensを超えるデータで事前学習されている。

しかし、この巨大さだけを根拠に「富豪的スケーリングが続いている」とは判断できない。
モデルを大きくすることと、モデルの基本設計を固定したまま資源だけを増やすことは別だからである。

Kimi K3とDeepSeek V4は、計算する場所、情報を残す場所、GPU間で通信する場所を選び直すことで、従来より大きな容量と長いコンテキストを成立させている。
モデルの規模ではなく、規模を成立させる方法が変わった。

富豪的スケーリングに代わり、アーキテクチャによるスケーリングの時代が始まりつつある。

## スケールを決めるものが変わった

GPT-2では、各層がAttentionとFFNからなり、トークンは原則として同じ計算経路を通る。
モデルを大きくすれば、すべてのトークンに対して、より大きなAttentionとFFNを動かすことになる。

この基本形を保ったまま、パラメータ、学習データ、GPU、学習時間を増やす方法がある。

**富豪的スケーリング**とは、このようにモデルの基本設計を固定し、投入する資源を増やす方法である。

富豪的スケーリングは強かった。
どの機能を作り込むべきか人間が細かく決めなくても、モデル容量とデータと計算量を増やせば、多くの課題で性能が上がったからである。

これに対して、モデル容量や系列長を増やしながら、毎トークンで動かす部分、保存する過去、GPU間で運ぶデータを構造によって選ぶ方法がある。
本番で使う数値精度と実行条件をpost-trainingのどの段階から組み込み、どの条件でRLのrolloutを生成するかも設計対象になる。

この方法が、**アーキテクチャによるスケーリング**である。

しかし、現在のLLMが支払う費用は、学習時の行列積だけではない。
長いコンテキスト、MoE、AIエージェント、推論時の長い思考が、それぞれ別の場所へ負荷を移した。

### 同じモデルのコピーを配るだけでは足りない

かつての分散学習を象徴したのは、Data Parallelismだった。
**Data Parallelism**は、各GPUへ同じモデルのコピーを置き、mini-batchのデータを分担して学習する方法である。
各GPUが計算したgradientを最後に同期すれば、一台のGPUで学習するときとほぼ同じ計算を、より多くのデータに対して並行して進められる。

Data Parallelismが唯一の分散方式だったわけではない。
それでも、同じモデルを複製してデータを分ける方法が主流だった時代には、モデルの数式と分散システムを比較的切り離して考えられた。
モデルを変えずにGPUの台数を増やすことが、分散学習の基本的なスケーリング戦略として通用したからである。

現代の巨大モデルでは、一つのモデルを各GPUへ丸ごと複製できない場合がある。
重みが収まっても、長いコンテキストのKV cacheやMoEの中間データが、メモリ容量と通信帯域を圧迫する。
そこで、一つのモデルの内部を複数の軸で分割する。

- **Tensor Parallelism**：一つの行列演算を複数のGPUへ分ける
- **Pipeline Parallelism**：モデルの層を前半と後半のように分ける
- **Expert Parallelism**：MoEのexpertを複数のGPUへ分ける
- **Context Parallelism**：長いトークン列を複数のGPUへ分ける

これらは、GPUを増やす同じ技法の別名ではない。
Tensor Parallelismは一つの層を計算する途中でGPU間の通信を増やし、Pipeline Parallelismは層の境界でデータを受け渡し、Expert Parallelismはトークンを担当expertへ送り、Context ParallelismはAttentionに必要な情報をGPU間で交換する。
モデルのどこを分割するかによって、発生する通信の量、順序、相手が変わる。

したがって現代のDistributed Trainingでは、完成したモデルをあとからGPUへ配置するだけでは済まない。
AttentionやMoEを設計する時点で、どの軸に沿って分割し、どの通信をGPUの計算と並行させて待ち時間を隠すかまで決める必要がある。

最初に詰まるのは長いコンテキストである。

**Full Attention**では、新しいトークンが過去の全トークンを参照する。
生成時には過去の各トークンから作ったKeyとValueを保存して再利用するが、この保存領域を**KV cache**と呼ぶ。
コンテキストが長くなるほど、一トークンを生成する参照計算とKV cacheが増える。

すると、GPUの演算能力だけを増やしても足りない。
KV cacheがGPUに直結した高速メモリであるHBMへ収まるか、重みとキャッシュを演算器へ十分な速さで運べるかが性能を決め始める。

次に、モデル容量を増やすためのMoEが通信を増やす。
MoEはFFNを多数の小さなFFNへ分け、routerがトークンごとに使うものを選ぶ仕組みである。
この小さなFFNをexpertと呼ぶ。

expertを複数のGPUへ分ければ計算量は減らせるが、各GPUは担当expertへトークンを送り合わなければならない。
この多対多のall-to-all通信が遅ければ、減らした計算時間は通信待ちで消える。

推論側でも計算の使い方が変わった。
AIエージェントの強化学習では、モデルが考え、外部toolを呼び、結果を受けて次の行動を選ぶまでの軌跡を大量に生成する。
この軌跡をrolloutと呼ぶ。

事前学習を終えたモデルへ指示追従、推論、tool利用などを学ばせる段階がpost-trainingである。
強化学習では、モデル自身がrolloutを生成し、その結果を使って重みを更新する。
推論は学習後の利用方法であるだけでなく、学習データを作る処理にもなった。

ここでrollout時と本番推論時の数値精度やkernelの挙動が違えば、強化学習は実際に配備するモデルとは少し違うモデルを相手に最適化することになる。
低精度化と推論基盤は、学習が終わってから決める実装上の詳細ではなく、post-trainingの条件になり始めている。

回答時に長く考えさせるtest-time computeも、性能と引き換えに生成トークン数とKV cacheを増やす。
事前学習だけでなく、長い推論を何度も実行する費用がモデル開発を制約するようになった。

FLOPsは依然として必要である。
ただし、演算回数だけを増やしても、メモリ容量、帯域、通信、推論時間のどこかで止まる。

同じGPUを使っても、どのトークンを参照し、どのexpertを動かし、何bitで重みを持ち、どの順序で通信し、どの条件でrolloutを生成するかによって、実際に動かせるモデルの規模とコンテキスト長が変わる。
アーキテクチャが再び重くなった理由はここにある。

もし従来の富豪的スケーリングだけで十分なら、KimiもDeepSeekも、GPT-2型の各部をそのまま巨大化すればよかったはずだ。
実際には、両者は計算を増やす場所と省く場所を細かく作り分けている。

## Kimi K3は二つのスケーリング軸を伸ばす

[Kimi K3の技術報告](https://arxiv.org/abs/2607.24653)は、巨大な事前学習基盤と、長文での強化学習およびtest-time computeを二つのスケーリング軸として掲げている。
第一の軸では、モデルを系列長、深さ、幅という三方向から組み替えた。

系列長に対する変更が、Kimi Delta Attention（KDA）とGated MLAの組み合わせである。
93層のうち69層がKDA、24層がGated MLAであり、三つのKDA層ごとに一つのGated MLA層を置く。

**Linear Attention**は、過去のトークンを一つずつ保持する代わりに、固定サイズの状態へ文脈を畳み込む方式である。
KDAはこの一種で、過去から更新してきた状態を次のトークンへ渡す。
状態の大きさが系列長に比例して増えないため、長文でのメモリ消費を抑えられる。

ただし、固定サイズの状態だけにすべての過去を圧縮すると、必要な情報を個別に取り出す力が弱くなる可能性がある。
そこでKimi K3は、KDAだけで全層を構成していない。

**MLA**（Multi-Head Latent Attention）は、KeyとValueを小さな内部ベクトルへ圧縮して保存するFull Attention系の方式である。
Gated MLAは、Attentionの出力をどれだけ層の出力へ混ぜるかも学習する。
KDAで大半の層を軽くしながら、四層に一層は過去のトークンを直接比較できる構成である。

深さ方向では、Attention Residualsを使う。
GPT-2型のresidual connectionは、一つ前の層の出力を足しながら情報を運ぶ。
**Attention Residuals**は、さらに前のblockや最初のembeddingも選んで参照し、深いモデルの途中で失われた情報へ戻れるようにする。

幅方向では、MoEが計算を選ぶ。
Kimi K3は896個のrouted expertを持つが、routerがトークンごとに選ぶのは16個である。

**Stable LatentMoE**は、expert内部の計算をモデル本体より小さなベクトル上で行う。
一個のexpertを軽くすることで、総パラメータ数を2.8Tまで増やしながら、毎トークンの計算に実際に参加するactivated parametersを104Bに抑えている。

expert内部のactivationにも、低精度で動かすことを見越した変更がある。
通常のSwiGLUは、掛け合わせる二つの値に上限がなく、大きなactivationが重なると低精度演算でoverflowしやすい。
Kimi K3の**SiTU-GLU**は、tanhによる滑らかな上限を両方の枝へ設け、小さい値に対するSwiGLUの性質を残しながら、極端に大きな値を抑える。

系列長ではKDAとMLAを使い分け、深さでは参照する過去の層を選び、幅では動かすexpertを選ぶ。
Kimi K3は、三つの方向すべてで情報の流れを選択的にし、FFNでは低精度演算へ入る値の範囲も制御している。

Kimiチームは、これらの変更と学習方法、データ構成を合わせることで、Kimi K2に対する全体的なスケーリング効率が約2.5倍になったと報告している。
これはKDA単体の数字ではなく、未学習データ上の誤差であるvalidation lossが同じ値へ到達するための計算量を、複数の変更を含むK3全体とK2で比べた結果である。

その前段にあたる[Kimi Linearの実験](https://arxiv.org/abs/2510.26692)でも、同一の学習条件でFull MLAと比較し、1Mコンテキスト時のKV cacheを最大75％削減し、デコードthroughputを最大6倍にしたと報告している。
throughputは、一秒あたりにシステム全体で生成できるトークン数を表す。

### Deployment-aware post-training

第二の軸では、1Mコンテキストでのtest-time scalingを前提にpost-trainingを設計した。
複数のreasoning effortで強化学習を行い、長いrollout、KV cache、sandboxの状態を保持するco-located RL systemも用意している。

この段階で、Kimi K3は本番推論の数値条件も学習へ取り込む。
MoE expertの重みをMXFP4、そのactivationをMXFP8とし、それ以外のAttention、router、shared expertなどは高い精度に残す。
QATはSFTから始まり、強化学習を含むpost-training全体を通して行われる。

強化学習では、rolloutとtrainingに同じ量子化方式を使う。
実際に配備する数値条件のモデル自身が、強化学習のデータを生成する。

SiTU-GLUがアーキテクチャ側でactivationの範囲を抑え、QATがpost-training側で量子化誤差へ適応し、同じ量子化方式のrolloutが強化学習のデータを作る。
量子化は最後の圧縮工程ではなく、blockの数式からRLまでをつなぐ設計条件になっている。

Kimi K3が狙うのは、小さいモデルで済ませることではない。
巨大な事前学習基盤とdeployment-awareな長文agentic RLを、二つの軸で同時に伸ばすことである。

## DeepSeek V4はモデルからdeploymentまでつなぐ

post-trainingや強化学習を見越した設計は、Kimi K3にもDeepSeek V4にもある。
DeepSeek V4では、その数値経路がMoE expertだけでなく長文Attentionの選択部分まで及び、teacher、reference model、RL rollout、本番推論を同じ低精度化の対象へ入れる。

[DeepSeek V4の技術報告](https://arxiv.org/html/2606.19348v1)によれば、V4-Proは1.6Tの総パラメータを持つが、トークンごとに動くのは49Bである。
V4-Flashも284Bの総パラメータに対して、動くのは13Bに限られる。

長文処理には、二種類のAttentionを組み合わせる。

- **CSA**：Compressed Sparse Attentionは、KV cacheを圧縮したうえで、現在のトークンと関係の深い項目だけを選んで参照する
- **HCA**：Heavily Compressed Attentionは、KV cacheをさらに強く圧縮し、少数になった項目すべてを参照する

CSAは参照先を減らし、HCAは参照前の情報量を減らす。
選択と圧縮を別の層で組み合わせることで、Full Attentionをそのまま1M tokensへ伸ばす費用を避けている。

FFNにはDeepSeekMoEを使う。
routed expertはトークンごとに選び、shared expertはすべてのトークンで動かす。
共通処理をshared expertへ残しながら、専門的な処理だけをrouted expertへ振り分ける構成である。

層のつなぎ方には、mHCを導入した。
**mHC**（Manifold-Constrained Hyper-Connections）は、層をまたいで表現を運ぶ一本のresidual streamを複数の経路へ広げる。
経路を混ぜる重みに制約を加え、深いモデルでも情報と、lossを減らすために逆向きへ伝わる学習信号であるgradientを安定して運ぼうとする。

学習時の重み更新にはMuonを使う。
**Muon**は、lossを下げる向きを表すgradientを要素ごとにそのまま扱わず、更新方向を行列として整えてから適用するoptimizerである。
DeepSeekは大半の行列パラメータをMuonで更新し、一部のparameterにはAdamWを残している。

しかし、モデル構造とoptimizerを変えただけでは、GPU上で速く動くとは限らない。
DeepSeek V4は、同じ技術報告の中でGPU上の実装も扱っている。

**Kernel**は、行列積や通信などをGPUで実行する小さなprogramである。
DeepSeekはMoEの計算、GPU間通信、メモリアクセスを一つのfused kernelへまとめ、どれか一つが終わるまで待つ時間と中間結果の書き戻しを減らす。

### 推論条件をpost-trainingへ戻す

DeepSeek V4の共同設計は、事前学習済みのbase modelを作ったところで終わらない。
post-trainingでは、数学、coding、agentなどのspecialistをfine-tuningと強化学習で個別に育て、複数のreasoning effortを学習させる。
その後、複数のspecialistを教師とするon-policy distillationで、能力を一つのモデルへ統合する。

このpost-trainingを1Mコンテキストで回すため、rollout serviceは処理を中断されても途中から再開できるようにし、長いtrajectoryのデータを軽いmetadataとtokenごとの重い情報へ分けて運ぶ。
長文Attentionの効率化は、本番で長い文を読めるようにするだけでなく、長い強化学習を実行可能にする条件でもある。

さらに、pre-training、post-training、推論で結果がずれないよう、batch内の他のrequestに影響されず、同じ入力から同じbit列の結果を再現するkernelを整備している。
rolloutが学習データになる以上、実行条件のわずかな違いも学習対象の違いへつながるからである。

数値表現では、FP4を推論直前の圧縮として後付けせず、post-trainingから実行経路へ組み込んだ。

optimizerは高精度なFP32 master weightsを保持する。
forward passでは、その重みをMXFP4へ量子化し、既存のFP8学習基盤で計算するためにFP8へ戻す。
FP32からFP4への量子化誤差は残るが、論文によれば、現在の重みはscale factorの条件を満たすため、作られたFP4値をFP8へ戻す段階では追加の情報を失わない。

backward passでは、FP8で使った重みに対するgradientをFP32 master weightsへ直接伝える。
量子化操作をgradient計算上は通過させるstraight-through estimatorとして扱うことで、FP8の学習frameworkを作り直さずにFP4 QATを実装している。

FP4を適用する場所もMoE expertの重みだけではない。
CSAが参照先を選ぶindexerでは、QueryとKeyのactivationをFP4のままcacheし、読み出し、積を計算する。
index scoreもFP32からBF16へ落とし、top-k selectorを2倍に高速化しながら、選ぶべきKV entryのrecallを99.7％に保ったと報告している。

強化学習のrolloutと本番推論では、QATを模擬する計算ではなくnative FP4 weightsを直接使う。
学習用のsamplingとdeploymentで同じ低精度経路を通し、量子化後にモデルの挙動がずれるのを避けている。

これらを組み合わせた結果、DeepSeek V4-Proは1Mコンテキストで、V3.2に対する単一トークン推論FLOPsを27％、KV cacheを10％まで減らしたと報告している。

CSAとHCAだけでは、MoEの通信は速くならない。
fused kernelだけでも、Full AttentionのKV cacheは減らない。
Muonだけでも、FP4の丸め誤差は解決しない。

長文Attention、QAT、RL system、native FP4 deploymentが、互いを成立条件としている。
DeepSeek V4の効率は、一つの発明でも、事前学習だけでも説明できない。

## アーキテクチャとシステムの共同設計

Kimi K3とDeepSeek V4に共通するのは、計算資源を減らしたことではない。
計算資源を性能へ変える仕組みを、モデルの数式からGPUクラスタまでつなげて設計したことである。

**Co-design**（共同設計）は、アルゴリズムと実行系を互いの制約に合わせて一緒に設計する考え方である。

現在のモデル開発は、次の積で考えたほうが実態に近い。

> **Architecture × Optimizer × Numerics × Kernels × Distributed Systems × Post-training**

ArchitectureはAttention、FFN、residualの接続を決める。
Optimizerは学習時の重みの更新方法を決め、NumericsはFP4やFP8などの数値表現を扱う。
KernelsはGPU上の処理単位であり、Distributed Systemsは多数のGPUへ計算とメモリをどう分けるかを扱う。
Post-trainingは事前学習後のinstruction tuningや強化学習を担う。

ただし、Post-trainingは積の最後に付け足す工程ではない。
強化学習のrolloutは推論そのものであり、そこで使う数値精度、kernel、分散システムが、モデルの次の重み更新に使われるデータを決める。

積である以上、どれか一つだけを改善しても、別の要素が上限になる。

KDAを考案しても、高速な専用kernelと、長い系列を複数GPUへ分けるcontext parallelismがなければ、大規模学習には使いにくい。
MoEのexpert数を増やしても、expertを複数GPUへ分けるexpert parallelismとall-to-all通信が詰まればGPUは待つ。
FP4も、optimizerのmaster weights、QAT、rollout、推論を同じ数値経路へそろえなければ、速度と性能を同時に保てない。

計算資源の投入そのものは、これからも続く。
DeepSeek V4-Flashは32T tokens、V4-Proは33T tokensで事前学習され、Kimi K3の総パラメータ数は2.8Tである。

ただし、資源量だけをスケーリングの設計原理にはできなくなった。
変わったのは、力の配分である。

| 従来の富豪的スケーリング | アーキテクチャによるスケーリング |
| --- | --- |
| 全パラメータを毎トークンで使うDenseモデルを巨大化する | MoEで総容量を増やし、必要なexpertだけ動かす |
| 過去の全トークンを個別に参照する | 過去を選択、圧縮、固定サイズの状態へ変換して参照する |
| モデルの数式を先に決める | kernel、通信、キャッシュ上で効率よく動く数式を選ぶ |
| 低精度化を推論時の圧縮として扱う | QAT、rollout、推論で同じFP4経路を使う |
| 完成したbase modelへ強化学習を追加する | 長文RL、reasoning effort、rolloutの再開まで先に設計する |
| 事前学習のFLOPsを増やす | 学習、post-training、回答時の計算量を配分する |

すべての場所へ均等に計算を注ぐ方法から、必要なexpert、必要な過去、必要な推論段階へ計算を集中させる方法へ移っている。

Kimi K3とDeepSeek V4の巨大さは、旧来の富豪的スケーリングがそのまま続いていることを示すものではない。
必要なexpertだけを動かし、必要な過去だけを参照し、数値表現と通信まで作り替えた結果として、その巨大さが成立している。

アーキテクチャの復権も、2010年代のように新しいblockを一つ発明すれば勝てるという話ではない。
Attention、MoE、residual、optimizer、数値表現、kernel、通信、post-trainingを、一つの実行可能なシステムとして成立させる研究が中心へ戻ってきた。

**富豪的スケーリングの時代が終わり、アーキテクチャによってスケールさせる時代が始まりつつある。**
