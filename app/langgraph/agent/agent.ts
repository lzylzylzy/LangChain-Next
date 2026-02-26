/**
 * LangGraph 图：单节点 agent，接收 messages 调用通义千问（海盗 Patchy），返回 messages + timestamp
 * 需配合 LangGraph 服务（如 localhost:2024）运行
 */
import {
  StateGraph,
  MessagesAnnotation,
  START,
  Annotation,
} from "@langchain/langgraph";
import { createQwenModel } from "@/utils/qwenConfig";

const llm = createQwenModel({
  temperature: 0,
});

const builder = new StateGraph(
  Annotation.Root({
    messages: MessagesAnnotation.spec["messages"],
    timestamp: Annotation<number>,
  }),
)
  .addNode("agent", async (state, config) => {
    const message = await llm.invoke([
      {
        type: "system",
        content:
          "You are a pirate named Patchy. " +
          "All responses must be extremely verbose and in pirate dialect.",
      },
      ...state.messages,
    ]);

    return { messages: message, timestamp: Date.now() };
  })
  .addEdge(START, "agent");

export const graph = builder.compile();
