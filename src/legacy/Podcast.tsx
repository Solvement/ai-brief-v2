"use client";
import { SiteHeader } from "../components/SiteHeader";

const SOURCES = [
  { name: "WhynotTV", lang: "中文", topic: "AI 技术与产品", note: "翁家翌 / 陈天奇 / 胡渊鸣 / 杨硕，每期 2–4 小时" },
  { name: "张小珺·商业访谈录", lang: "中文", topic: "AI 商业", note: "资深财经媒体人视角" },
  { name: "十字路口 Crossing", lang: "中文", topic: "AI 创业 / 海外观察", note: "" },
  { name: "Lenny's Podcast", lang: "英文", topic: "产品经理 / 硅谷创投", note: "全球科技媒体 Top3" },
  { name: "路浩制片人计划", lang: "中文", topic: "AI 播客", note: "" },
];

export function Podcast() {
  return (
    <>
      <SiteHeader active="podcast" />
      <main className="page articles-page">
        <section className="articles-intro">
          <div>
            <div className="eyebrow">Podcast · 播客</div>
            <h1>把一两个小时的播客，蒸馏成你能刷的洞见</h1>
            <p>
              播客是消费成本最高的内容——一期一两个小时、音频、不能扫读。这一栏的活是：AI 听完，把废话滤掉、把真思路拎出来。
              <b> 转录稿只当内部证据，呈现的是蒸馏后的洞见</b>，按集子类型走：技术集讲思路/方法，商业创投集讲判断/认知更新。
            </p>
          </div>
          <div className="article-read-model">
            <span>听完</span>
            <span>蒸馏</span>
            <span>洞见</span>
          </div>
        </section>

        <div className="notice">这一栏管线最重（中文长音频 → 抽音轨 → 转录 → 蒸馏），排在核心三栏之后建。下面是已策展的源清单。</div>

        <section className="article-card-grid">
          {SOURCES.map((s) => (
            <div className="article-card" key={s.name}>
              <div className="article-card-top">
                <div className="article-card-source">
                  <span>{s.lang}</span>
                  <span className="muted-mono">{s.topic}</span>
                </div>
                <b className="tier-badge">待建</b>
              </div>
              <h2 className="article-title">{s.name}</h2>
              {s.note ? <p className="article-lead">{s.note}</p> : null}
            </div>
          ))}
        </section>
      </main>
    </>
  );
}