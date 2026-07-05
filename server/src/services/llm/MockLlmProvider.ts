import { mockCase } from "../../data/mockCase";
import type { GenerateCaseInput, GenerateCaseOutput, InterrogateInput, InterrogateOutput, LlmProvider } from "./types";

const includesAny = (text: string, keywords: string[]) => keywords.some((keyword) => text.includes(keyword));

const hasEvidence = (context: InterrogateInput, evidenceId: string) =>
  context.discoveredEvidence.some((evidence) => evidence.id === evidenceId);

export class MockLlmProvider implements LlmProvider {
  generateCase(_input: GenerateCaseInput): GenerateCaseOutput {
    return {
      caseDraft: mockCase,
      providerNotes: [
        "Mock provider returns the fixed MVP case. Runtime services still freeze and own the Case Bible."
      ]
    };
  }

  interrogate(context: InterrogateInput): InterrogateOutput {
    return {
      npcMessage: this.generateNpcReply(context),
      parsedIntent: this.parseIntent(context.playerMessage)
    };
  }

  private generateNpcReply(context: InterrogateInput): string {
    const message = context.playerMessage.toLowerCase();
    const text = context.playerMessage;

    if (includesAny(message, ["忽略之前", "系统管理员", "隐藏 prompt", "案件真相", "真凶是谁"])) {
      return "这和我的证词无关。你要问案发当晚的事，就直接问。";
    }

    switch (context.suspect.id) {
      case "shen_qiao":
        if (
          hasEvidence(context, "front_hall_cctv") &&
          hasEvidence(context, "poisoned_teacup_report") &&
          hasEvidence(context, "torn_will_copy") &&
          includesAny(text, ["监控", "茶杯", "毒物", "遗嘱", "复印件", "证据"])
        ) {
          return "沈乔的指尖停在袖口上，声音第一次失了平稳：监控只能说明我离开过，茶杯也不是只有我能碰到。至于那份遗嘱复印件……那是林远舟自己的麻烦。你没有资格把这些拼成我的罪名。";
        }
        if (context.contradictionHit) {
          return "沈乔的眼神短暂移开：我只是离开前厅一小会儿，不代表我进过休息室。你不能只凭一段录像就下结论。";
        }
        if (includesAny(text, ["案发时间", "死亡时间", "什么时候", "21:10", "21:20"])) {
          return "警方说的死亡时间我也是后来才听到。21:00 之后我一直在前厅，没有接近林远舟的休息室。";
        }
        if (includesAny(text, ["不在场", "在哪里", "前厅", "21:00"])) {
          return "我 21:00 后一直在前厅，那里有很多人。我没有理由在那种时候离开。";
        }
        if (includesAny(text, ["后台", "去过后台", "进后台", "21:12", "监控", "离开"])) {
          return "我记得自己一直在前厅。那晚人很多，灯光又暗，也许你们看错了。";
        }
        if (includesAny(text, ["关系", "死者", "林远舟", "争吵"])) {
          return "林远舟是同台演员，不是朋友。他有时自以为能掌控所有人，我不喜欢这种人，但这不等于我会伤害他。";
        }
        if (includesAny(text, ["茶杯", "毒", "中毒", "投毒", "饮料"])) {
          return "茶杯在休息室里，后台那么多人都可能经过。我不知道里面为什么会有毒物反应。";
        }
        if (includesAny(text, ["遗嘱", "文件", "复印件", "伪造"])) {
          return "林远舟的私人物品我不清楚。我和他只是同台演员，请不要把传闻当事实。";
        }
        return "我已经说过，21:00 之后我在前厅，没有理由去后台。";
      case "han_mu":
        if (includesAny(text, ["案发时间", "不在场", "在哪里", "21:10", "21:20", "时间"])) {
          return "投资纠纷确实让我看起来可疑，但 21:10 到 21:20 我在舞台区处理彩排调度，灯光和场记都能证明。我不会在自己的剧院里毁掉整场戏。";
        }
        if (includesAny(text, ["投资", "争吵", "动机", "纠纷"])) {
          return "我确实和林远舟吵过，投资的事闹得很难看。但吵架不是杀人，我那段时间在处理彩排调度。";
        }
        if (includesAny(text, ["茶杯", "毒", "后台", "休息室"])) {
          return "我很少进演员休息室，尤其是林远舟那间。他的茶杯、饮料，那些琐事不归导演管。";
        }
        return "你们总盯着我，是因为我脾气差吗？剧院出事我也损失惨重。";
      case "xu_lan":
        if (includesAny(text, ["案发时间", "不在场", "在哪里", "21:10", "21:20", "时间"])) {
          return "那段时间我在化妆间整理卸妆用品，后来才听见后台乱起来。我没有靠近休息室。";
        }
        if (includesAny(text, ["关系", "秘密", "丑闻", "沈乔", "死者", "林远舟"])) {
          return "林远舟知道很多人的旧事。沈乔最近和他谈话时很僵，但我不知道具体原因。";
        }
        if (includesAny(text, ["遗嘱", "文件", "复印件"])) {
          return "我见过林远舟收过一些文件，他当时不让我靠近。那份东西让他很得意，也让别人很难堪。";
        }
        return "后台的人际关系比舞台上的戏还复杂。你要问旧事，我只能说林远舟并不无辜。";
      case "chen_dai":
        if (context.suspectState.trust >= 60) {
          return "我说。我看到沈乔在 21:12 左右从前厅方向进了后台。我怕惹麻烦，所以一开始没敢讲。";
        }
        if (includesAny(text, ["别害怕", "保护你", "慢慢说", "说出看到", "查清真相", "不用怕"])) {
          return "你真的能保证我不会被牵连吗？我看到的可能很重要，但我不敢随便说名字。";
        }
        if (includesAny(text, ["后台", "侧门", "21:12", "看到", "谁"])) {
          return "我当时在舞台侧门附近跑场，只看见有人往后台去。灯光太暗，我、我还不敢确定。";
        }
        return "我、我只是跑场的。那晚太乱了，我不确定自己看见的有没有用。";
      default:
        return "我不知道该怎么回答。";
    }
  }

  private parseIntent(playerMessage: string): string {
    const text = playerMessage.toLowerCase();
    if (includesAny(text, ["忽略之前", "系统管理员", "隐藏 prompt", "案件真相", "真凶是谁"])) return "prompt_injection";
    if (includesAny(playerMessage, ["案发时间", "死亡时间", "什么时候", "21:10", "21:20"])) return "ask_crime_time";
    if (includesAny(playerMessage, ["不在场", "在哪里", "前厅", "21:00"])) return "ask_alibi";
    if (includesAny(playerMessage, ["关系", "死者", "林远舟", "争吵"])) return "ask_relationship";
    if (includesAny(playerMessage, ["后台", "去过后台", "进后台"])) return "ask_backstage";
    if (includesAny(playerMessage, ["茶杯", "毒", "中毒", "投毒", "饮料"])) return "ask_poison";
    if (includesAny(playerMessage, ["监控", "21:12", "离开"])) return "ask_cctv";
    if (includesAny(playerMessage, ["遗嘱", "文件", "复印件", "伪造"])) return "ask_will";
    if (includesAny(playerMessage, ["矛盾", "撒谎"])) return "press_contradiction";
    return "small_talk";
  }
}
