import type {
  CaseFile,
  Contradiction,
  Evidence,
  Location,
  Suspect,
  SuspectState
} from "@blackbox-detective/shared";

export interface MockCaseTemplate extends Omit<CaseFile, "id" | "startedAt"> {
  title: string;
  synopsis: string;
  victim: string;
  suspects: Suspect[];
  locations: Location[];
  evidence: Evidence[];
  contradictions: Contradiction[];
}

const state = (trust: number, pressure: number, defense: number): SuspectState => ({
  trust,
  pressure,
  defense,
  unlockedEvidenceIds: [],
  discoveredContradictionIds: []
});

export const mockCase: MockCaseTemplate = {
  title: "雨夜剧院谋杀案",
  synopsis:
    "暮雨剧院最后一次彩排的雨夜，知名男演员林远舟死于后台休息室。警方判断死亡时间在 21:10 到 21:20，剧院已被临时封锁。",
  victim: "林远舟",
  suspects: [
    {
      id: "shen_qiao",
      name: "沈乔",
      role: "女主演",
      age: 32,
      personality: "冷静克制，擅长转移话题",
      publicProfile: "剧院本次演出的女主演，案发后坚持自己整晚都在前厅。",
      hiddenSecret: "伪造遗嘱被死者发现。",
      isCulprit: true,
      knowledge: ["前厅", "后台", "遗嘱", "茶杯"],
      lies: ["21:00 后一直在前厅", "没有进入后台"],
      revealRules: [
        {
          id: "shen_qiao_pressure_after_contradiction",
          description: "当前厅监控矛盾被命中后，沈乔出现明显动摇。",
          requiredPressure: 30,
          requiredEvidenceIds: ["front_hall_cctv", "shen_qiao_alibi_claim"],
          unlockEvidenceIds: ["shen_qiao_pressure_note"]
        }
      ],
      currentState: state(15, 5, 85)
    },
    {
      id: "han_mu",
      name: "韩牧",
      role: "剧院导演",
      age: 45,
      personality: "急躁强硬，对警方不耐烦",
      publicProfile: "与死者有投资纠纷，案发前曾和死者激烈争吵。",
      hiddenSecret: "投资纠纷让他看起来可疑，但时间线排除他。",
      isCulprit: false,
      knowledge: ["投资纠纷", "争吵", "彩排安排"],
      lies: [],
      revealRules: [],
      currentState: state(25, 35, 55)
    },
    {
      id: "xu_lan",
      name: "许澜",
      role: "化妆师",
      age: 29,
      personality: "谨慎敏感，习惯观察别人脸色",
      publicProfile: "曾替死者隐瞒旧丑闻，知道剧院内部关系。",
      hiddenSecret: "替死者压下过旧丑闻。",
      isCulprit: false,
      knowledge: ["旧丑闻", "人物关系", "沈乔与死者不和"],
      lies: [],
      revealRules: [],
      currentState: state(35, 20, 45)
    },
    {
      id: "chen_dai",
      name: "陈岱",
      role: "舞台助理",
      age: 24,
      personality: "紧张胆怯，不愿卷入案件",
      publicProfile: "彩排期间负责舞台侧门和后台跑场。",
      hiddenSecret: "看见沈乔在 21:12 左右进入后台。",
      isCulprit: false,
      knowledge: ["舞台侧门", "后台路线", "21:12 目击"],
      lies: [],
      revealRules: [
        {
          id: "chen_dai_trust_testimony",
          description: "陈岱信任提升后愿意说出 21:12 的目击证词。",
          requiredTrust: 60,
          unlockEvidenceIds: ["chen_dai_testimony"]
        }
      ],
      currentState: state(10, 55, 70)
    }
  ],
  locations: [
    {
      id: "front_hall",
      name: "剧院前厅",
      description: "雨水敲打玻璃穹顶，宾客签到表还摊在接待台上。沈乔声称 21:00 后一直在这里。",
      evidenceIds: ["front_hall_signup", "front_hall_departure_clue"],
      suspectIds: ["shen_qiao", "han_mu"]
    },
    {
      id: "backstage_lounge",
      name: "后台休息室",
      description: "林远舟倒下的地方。茶几上留着茶杯，碎纸被仓促塞进沙发缝。",
      evidenceIds: ["victim_teacup", "poisoned_teacup_report", "torn_will_copy"],
      suspectIds: ["shen_qiao", "xu_lan"]
    },
    {
      id: "stage_side_door",
      name: "舞台侧门",
      description: "连接前厅与后台的狭窄通道，地面还留着被雨水带进来的泥印。",
      evidenceIds: ["side_door_footprint", "side_door_heelprint"],
      suspectIds: ["chen_dai", "shen_qiao"]
    },
    {
      id: "prop_room",
      name: "道具室",
      description: "杂乱的旧道具堆在墙边，一件带血道具格外刺眼。",
      evidenceIds: ["bloody_prop"],
      suspectIds: ["han_mu", "xu_lan"]
    },
    {
      id: "security_room",
      name: "监控室",
      description: "数块屏幕显示着剧院各处的灰蓝色录像，时间码一帧帧跳动。",
      evidenceIds: ["front_hall_cctv"],
      suspectIds: ["shen_qiao", "chen_dai"]
    }
  ],
  evidence: [
    {
      id: "front_hall_signup",
      type: "timeline",
      title: "宾客签到表",
      description: "签到表显示多数人在 21:00 前后聚集于前厅，但之后人员流动没有被纸面记录覆盖。",
      source: "剧院前厅",
      relatedSuspectIds: ["shen_qiao", "han_mu"],
      tags: ["前厅", "时间线"],
      isKeyEvidence: false,
      discovered: false
    },
    {
      id: "front_hall_departure_clue",
      type: "timeline",
      title: "前厅离场线索",
      description: "签到台旁的值班记录提到 21:12 左右前厅短暂出现人员离场，但记录不完整，需要去监控室确认。",
      source: "剧院前厅",
      relatedSuspectIds: ["shen_qiao"],
      tags: ["前厅", "21:12", "线索入口"],
      isKeyEvidence: false,
      discovered: false
    },
    {
      id: "shen_qiao_alibi_claim",
      type: "testimony",
      title: "沈乔的不在场证明证词",
      description: "沈乔坚持称自己 21:00 后一直留在前厅，没有进入后台。",
      source: "剧院前厅",
      relatedSuspectIds: ["shen_qiao"],
      tags: ["前厅", "不在场证明", "21:00"],
      isKeyEvidence: false,
      discovered: false
    },
    {
      id: "victim_teacup",
      type: "physical",
      title: "死者茶杯",
      description: "茶杯停在休息室茶几边缘，杯口有淡色唇印，残液散发出异常苦味。",
      source: "后台休息室",
      relatedSuspectIds: ["shen_qiao"],
      tags: ["茶杯", "休息室", "物证"],
      isKeyEvidence: false,
      discovered: false
    },
    {
      id: "poisoned_teacup_report",
      type: "physical",
      title: "茶杯毒物检测",
      description: "死者茶杯边缘与残液中检出毒物反应，符合中毒死亡判断。",
      source: "后台休息室",
      relatedSuspectIds: ["shen_qiao"],
      tags: ["茶杯", "毒物", "作案手段"],
      isKeyEvidence: true,
      discovered: false
    },
    {
      id: "torn_will_copy",
      type: "relationship",
      title: "撕毁的遗嘱复印件",
      description: "碎片拼合后能看出遗嘱复印件痕迹，部分笔迹和日期存在伪造嫌疑。",
      source: "后台休息室",
      relatedSuspectIds: ["shen_qiao", "xu_lan"],
      tags: ["遗嘱", "伪造", "动机"],
      isKeyEvidence: true,
      discovered: false
    },
    {
      id: "side_door_footprint",
      type: "physical",
      title: "侧门脚印",
      description: "舞台侧门地面有从前厅方向带入的湿泥脚印，路线通往后台。",
      source: "舞台侧门",
      relatedSuspectIds: ["shen_qiao", "chen_dai"],
      tags: ["侧门", "脚印", "后台"],
      isKeyEvidence: false,
      discovered: false
    },
    {
      id: "side_door_heelprint",
      type: "physical",
      title: "侧门鞋跟痕迹",
      description: "舞台侧门附近有细高跟留下的湿泥痕迹，路线指向后台。",
      source: "舞台侧门",
      relatedSuspectIds: ["shen_qiao"],
      tags: ["侧门", "后台", "机会"],
      isKeyEvidence: false,
      discovered: false
    },
    {
      id: "bloody_prop",
      type: "physical",
      title: "带血道具",
      description: "道具剑上有陈旧血迹，经初步判断更像旧演出事故留下的残迹。",
      source: "道具室",
      relatedSuspectIds: ["han_mu"],
      tags: ["道具", "误导"],
      isKeyEvidence: false,
      discovered: false
    },
    {
      id: "front_hall_cctv",
      type: "timeline",
      title: "前厅监控录像",
      description: "录像显示沈乔在 21:12 离开前厅，并朝后台方向走去。",
      source: "监控室",
      relatedSuspectIds: ["shen_qiao"],
      tags: ["21:12", "前厅", "后台", "时间线"],
      isKeyEvidence: true,
      discovered: false
    },
    {
      id: "chen_dai_testimony",
      type: "testimony",
      title: "陈岱证词",
      description: "陈岱承认自己看到沈乔在 21:12 左右从前厅方向进入后台。",
      source: "陈岱审讯",
      relatedSuspectIds: ["chen_dai", "shen_qiao"],
      tags: ["目击", "21:12", "后台"],
      isKeyEvidence: true,
      discovered: false
    },
    {
      id: "shen_qiao_pressure_note",
      type: "contradiction",
      title: "沈乔动摇反应",
      description: "当监控录像与沈乔证词对上时，她短暂改口称自己只是离开前厅一小会儿。",
      source: "沈乔审讯",
      relatedSuspectIds: ["shen_qiao"],
      tags: ["矛盾", "前厅", "21:12"],
      isKeyEvidence: false,
      discovered: false
    }
  ],
  contradictions: [
    {
      id: "shenqiao_alibi_contradiction",
      title: "沈乔前厅不在场证明矛盾",
      claimEvidenceId: "shen_qiao_alibi_claim",
      counterEvidenceId: "front_hall_cctv",
      suspectId: "shen_qiao",
      description: "沈乔声称 21:00 后一直在前厅，但监控显示她 21:12 离开前厅并前往后台方向。",
      unlockedEvidenceIds: ["shen_qiao_pressure_note"]
    }
  ],
  truth: {
    culpritId: "shen_qiao",
    motive: "死者掌握了沈乔伪造遗嘱的证据，并可能用此威胁她。",
    method: "沈乔在死者茶杯中投毒。",
    timeline: "沈乔 21:12 离开前厅，经舞台侧门进入后台，在 21:10 到 21:20 的死亡窗口内完成投毒。",
    fakeAlibi: "沈乔声称自己 21:00 后一直在前厅。",
    keyEvidenceIds: ["front_hall_cctv", "poisoned_teacup_report", "torn_will_copy", "chen_dai_testimony"]
  }
};
