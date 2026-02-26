/**
 * 首页：基础对话（海盗 Patchy）
 * 使用 api/chat 流式对话，空状态展示引导信息
 */
import { ChatWindow } from "@/components/ChatWindow";
import { GuideInfoBox } from "@/components/guide/GuideInfoBox";

export default function Home() {
    const InfoCard = (
        <GuideInfoBox >
            <ul>
                <li>
                    结构化输出
                </li>
                <li>
                    检索
                </li>
            </ul>
        </GuideInfoBox>
    );
    return (
        <ChatWindow
            endpoint="api/chat"
            emoji="🤖"
            placeholder="随便问我问题!"
            emptyStateComponent={InfoCard}
        />
    );
}
