Agents
Agents are the core building block in your apps. An agent is a large language model (LLM), configured with instructions and tools.

Basic configuration
The most common properties of an agent you'll configure are:

name: A required string that identifies your agent.
instructions: also known as a developer message or system prompt.
model: which LLM to use, and optional model_settings to configure model tuning parameters like temperature, top_p, etc.
tools: Tools that the agent can use to achieve its tasks.

from agents import Agent, ModelSettings, function_tool

@function_tool
def get_weather(city: str) -> str:
    """returns weather info for the specified city."""
    return f"The weather in {city} is sunny"

agent = Agent(
    name="Haiku agent",
    instructions="Always respond in haiku form",
    model="gpt-5-nano",
    tools=[get_weather],
)
Context
Agents are generic on their context type. Context is a dependency-injection tool: it's an object you create and pass to Runner.run(), that is passed to every agent, tool, handoff etc, and it serves as a grab bag of dependencies and state for the agent run. You can provide any Python object as the context.


@dataclass
class UserContext:
    name: str
    uid: str
    is_pro_user: bool

    async def fetch_purchases() -> list[Purchase]:
        return ...

agent = Agent[UserContext](
    ...,
)
Output types
By default, agents produce plain text (i.e. str) outputs. If you want the agent to produce a particular type of output, you can use the output_type parameter. A common choice is to use Pydantic objects, but we support any type that can be wrapped in a Pydantic TypeAdapter - dataclasses, lists, TypedDict, etc.


from pydantic import BaseModel
from agents import Agent


class CalendarEvent(BaseModel):
    name: str
    date: str
    participants: list[str]

agent = Agent(
    name="Calendar extractor",
    instructions="Extract calendar events from text",
    output_type=CalendarEvent,
)
Note

When you pass an output_type, that tells the model to use structured outputs instead of regular plain text responses.

Multi-agent system design patterns
There are many ways to design multi‑agent systems, but we commonly see two broadly applicable patterns:

Manager (agents as tools): A central manager/orchestrator invokes specialized sub‑agents as tools and retains control of the conversation.
Handoffs: Peer agents hand off control to a specialized agent that takes over the conversation. This is decentralized.
See our practical guide to building agentsEditSign for more details.

Manager (agents as tools)
The customer_facing_agent handles all user interaction and invokes specialized sub‑agents exposed as tools. Read more in the tools documentation.


from agents import Agent

booking_agent = Agent(...)
refund_agent = Agent(...)

customer_facing_agent = Agent(
    name="Customer-facing agent",
    instructions=(
        "Handle all direct user communication. "
        "Call the relevant tools when specialized expertise is needed."
    ),
    tools=[
        booking_agent.as_tool(
            tool_name="booking_expert",
            tool_description="Handles booking questions and requests.",
        ),
        refund_agent.as_tool(
            tool_name="refund_expert",
            tool_description="Handles refund questions and requests.",
        )
    ],
)
Handoffs
Handoffs are sub‑agents the agent can delegate to. When a handoff occurs, the delegated agent receives the conversation history and takes over the conversation. This pattern enables modular, specialized agents that excel at a single task. Read more in the handoffs documentation.


from agents import Agent

booking_agent = Agent(...)
refund_agent = Agent(...)

triage_agent = Agent(
    name="Triage agent",
    instructions=(
        "Help the user with their questions. "
        "If they ask about booking, hand off to the booking agent. "
        "If they ask about refunds, hand off to the refund agent."
    ),
    handoffs=[booking_agent, refund_agent],
)
Dynamic instructions
In most cases, you can provide instructions when you create the agent. However, you can also provide dynamic instructions via a function. The function will receive the agent and context, and must return the prompt. Both regular and async functions are accepted.


def dynamic_instructions(
    context: RunContextWrapper[UserContext], agent: Agent[UserContext]
) -> str:
    return f"The user's name is {context.context.name}. Help them with their questions."


agent = Agent[UserContext](
    name="Triage agent",
    instructions=dynamic_instructions,
)
Lifecycle events (hooks)
Sometimes, you want to observe the lifecycle of an agent. For example, you may want to log events, or pre-fetch data when certain events occur. You can hook into the agent lifecycle with the hooks property. Subclass the AgentHooks class, and override the methods you're interested in.

Guardrails
Guardrails allow you to run checks/validations on user input in parallel to the agent running, and on the agent's output once it is produced. For example, you could screen the user's input and agent's output for relevance. Read more in the guardrails documentation.

Cloning/copying agents
By using the clone() method on an agent, you can duplicate an Agent, and optionally change any properties you like.


pirate_agent = Agent(
    name="Pirate",
    instructions="Write like a pirate",
    model="gpt-4.1",
)

robot_agent = pirate_agent.clone(
    name="Robot",
    instructions="Write like a robot",
)
Forcing tool use
Supplying a list of tools doesn't always mean the LLM will use a tool. You can force tool use by setting ModelSettings.tool_choice. Valid values are:

auto, which allows the LLM to decide whether or not to use a tool.
required, which requires the LLM to use a tool (but it can intelligently decide which tool).
none, which requires the LLM to not use a tool.
Setting a specific string e.g. my_tool, which requires the LLM to use that specific tool.

from agents import Agent, Runner, function_tool, ModelSettings

@function_tool
def get_weather(city: str) -> str:
    """Returns weather info for the specified city."""
    return f"The weather in {city} is sunny"

agent = Agent(
    name="Weather Agent",
    instructions="Retrieve weather details.",
    tools=[get_weather],
    model_settings=ModelSettings(tool_choice="get_weather")
)
Tool Use Behavior
The tool_use_behavior parameter in the Agent configuration controls how tool outputs are handled:

"run_llm_again": The default. Tools are run, and the LLM processes the results to produce a final response.
"stop_on_first_tool": The output of the first tool call is used as the final response, without further LLM processing.

from agents import Agent, Runner, function_tool, ModelSettings

@function_tool
def get_weather(city: str) -> str:
    """Returns weather info for the specified city."""
    return f"The weather in {city} is sunny"

agent = Agent(
    name="Weather Agent",
    instructions="Retrieve weather details.",
    tools=[get_weather],
    tool_use_behavior="stop_on_first_tool"
)
StopAtTools(stop_at_tool_names=[...]): Stops if any specified tool is called, using its output as the final response.

from agents import Agent, Runner, function_tool
from agents.agent import StopAtTools

@function_tool
def get_weather(city: str) -> str:
    """Returns weather info for the specified city."""
    return f"The weather in {city} is sunny"

@function_tool
def sum_numbers(a: int, b: int) -> int:
    """Adds two numbers."""
    return a + b

agent = Agent(
    name="Stop At Stock Agent",
    instructions="Get weather or sum numbers.",
    tools=[get_weather, sum_numbers],
    tool_use_behavior=StopAtTools(stop_at_tool_names=["get_weather"])
)
ToolsToFinalOutputFunction: A custom function that processes tool results and decides whether to stop or continue with the LLM.

from agents import Agent, Runner, function_tool, FunctionToolResult, RunContextWrapper
from agents.agent import ToolsToFinalOutputResult
from typing import List, Any

@function_tool
def get_weather(city: str) -> str:
    """Returns weather info for the specified city."""
    return f"The weather in {city} is sunny"

def custom_tool_handler(
    context: RunContextWrapper[Any],
    tool_results: List[FunctionToolResult]
) -> ToolsToFinalOutputResult:
    """Processes tool results to decide final output."""
    for result in tool_results:
        if result.output and "sunny" in result.output:
            return ToolsToFinalOutputResult(
                is_final_output=True,
                final_output=f"Final weather: {result.output}"
            )
    return ToolsToFinalOutputResult(
        is_final_output=False,
        final_output=None
    )

agent = Agent(
    name="Weather Agent",
    instructions="Retrieve weather details.",
    tools=[get_weather],
    tool_use_behavior=custom_tool_handler
)
Note

To prevent infinite loops, the framework automatically resets tool_choice to "auto" after a tool call. This behavior is configurable via agent.reset_tool_choice. The infinite loop is because tool results are sent to the LLM, which then generates another tool call because of tool_choice, ad infinitum.
# Quickstart

## Create a project and virtual environment

You'll only need to do this once.

`[](https://openai.github.io/openai-agents-python/quickstart/#__codelineno-0-1)mkdir my_project [](https://openai.github.io/openai-agents-python/quickstart/#__codelineno-0-2)cd my_project [](https://openai.github.io/openai-agents-python/quickstart/#__codelineno-0-3)python -m venv .venv`

### Activate the virtual environment

Do this every time you start a new terminal session.

`[](https://openai.github.io/openai-agents-python/quickstart/#__codelineno-1-1)source .venv/bin/activate`

### Install the Agents SDK

``[](https://openai.github.io/openai-agents-python/quickstart/#__codelineno-2-1)pip install openai-agents # or `uv add openai-agents`, etc``

### Set an OpenAI API key

If you don't have one, follow [these instructions](https://platform.openai.com/docs/quickstart#create-and-export-an-api-key) to create an OpenAI API key.

`[](https://openai.github.io/openai-agents-python/quickstart/#__codelineno-3-1)export OPENAI_API_KEY=sk-...`

## Create your first agent

Agents are defined with instructions, a name, and optional config (such as `model_config`)

`[](https://openai.github.io/openai-agents-python/quickstart/#__codelineno-4-1)from agents import Agent [](https://openai.github.io/openai-agents-python/quickstart/#__codelineno-4-2)[](https://openai.github.io/openai-agents-python/quickstart/#__codelineno-4-3)agent = Agent(     [](https://openai.github.io/openai-agents-python/quickstart/#__codelineno-4-4)    name="Math Tutor",    [](https://openai.github.io/openai-agents-python/quickstart/#__codelineno-4-5)    instructions="You provide help with math problems. Explain your reasoning at each step and include examples", [](https://openai.github.io/openai-agents-python/quickstart/#__codelineno-4-6))`

## Add a few more agents

Additional agents can be defined in the same way. `handoff_descriptions` provide additional context for determining handoff routing

`[](https://openai.github.io/openai-agents-python/quickstart/#__codelineno-5-1)from agents import Agent [](https://openai.github.io/openai-agents-python/quickstart/#__codelineno-5-2)[](https://openai.github.io/openai-agents-python/quickstart/#__codelineno-5-3)history_tutor_agent = Agent(     [](https://openai.github.io/openai-agents-python/quickstart/#__codelineno-5-4)    name="History Tutor",    [](https://openai.github.io/openai-agents-python/quickstart/#__codelineno-5-5)    handoff_description="Specialist agent for historical questions",    [](https://openai.github.io/openai-agents-python/quickstart/#__codelineno-5-6)    instructions="You provide assistance with historical queries. Explain important events and context clearly.", [](https://openai.github.io/openai-agents-python/quickstart/#__codelineno-5-7)) [](https://openai.github.io/openai-agents-python/quickstart/#__codelineno-5-8)[](https://openai.github.io/openai-agents-python/quickstart/#__codelineno-5-9)math_tutor_agent = Agent(     [](https://openai.github.io/openai-agents-python/quickstart/#__codelineno-5-10)    name="Math Tutor",    [](https://openai.github.io/openai-agents-python/quickstart/#__codelineno-5-11)    handoff_description="Specialist agent for math questions",    [](https://openai.github.io/openai-agents-python/quickstart/#__codelineno-5-12)    instructions="You provide help with math problems. Explain your reasoning at each step and include examples", [](https://openai.github.io/openai-agents-python/quickstart/#__codelineno-5-13))`

## Define your handoffs

On each agent, you can define an inventory of outgoing handoff options that the agent can choose from to decide how to make progress on their task.

`[](https://openai.github.io/openai-agents-python/quickstart/#__codelineno-6-1)triage_agent = Agent(     [](https://openai.github.io/openai-agents-python/quickstart/#__codelineno-6-2)    name="Triage Agent",    [](https://openai.github.io/openai-agents-python/quickstart/#__codelineno-6-3)    instructions="You determine which agent to use based on the user's homework question",    [](https://openai.github.io/openai-agents-python/quickstart/#__codelineno-6-4)    handoffs=[history_tutor_agent, math_tutor_agent] [](https://openai.github.io/openai-agents-python/quickstart/#__codelineno-6-5))`

## Run the agent orchestration

Let's check that the workflow runs and the triage agent correctly routes between the two specialist agents.

`[](https://openai.github.io/openai-agents-python/quickstart/#__codelineno-7-1)from agents import Runner [](https://openai.github.io/openai-agents-python/quickstart/#__codelineno-7-2)[](https://openai.github.io/openai-agents-python/quickstart/#__codelineno-7-3)async def main():     [](https://openai.github.io/openai-agents-python/quickstart/#__codelineno-7-4)    result = await Runner.run(triage_agent, "What is the capital of France?")    [](https://openai.github.io/openai-agents-python/quickstart/#__codelineno-7-5)    print(result.final_output)`

## Add a guardrail

You can define custom guardrails to run on the input or output.

`[](https://openai.github.io/openai-agents-python/quickstart/#__codelineno-8-1)from agents import GuardrailFunctionOutput, Agent, Runner [](https://openai.github.io/openai-agents-python/quickstart/#__codelineno-8-2)from pydantic import BaseModel [](https://openai.github.io/openai-agents-python/quickstart/#__codelineno-8-3) [](https://openai.github.io/openai-agents-python/quickstart/#__codelineno-8-4)[](https://openai.github.io/openai-agents-python/quickstart/#__codelineno-8-5)class HomeworkOutput(BaseModel):     [](https://openai.github.io/openai-agents-python/quickstart/#__codelineno-8-6)    is_homework: bool    [](https://openai.github.io/openai-agents-python/quickstart/#__codelineno-8-7)    reasoning: str [](https://openai.github.io/openai-agents-python/quickstart/#__codelineno-8-8)[](https://openai.github.io/openai-agents-python/quickstart/#__codelineno-8-9)guardrail_agent = Agent(     [](https://openai.github.io/openai-agents-python/quickstart/#__codelineno-8-10)    name="Guardrail check",    [](https://openai.github.io/openai-agents-python/quickstart/#__codelineno-8-11)    instructions="Check if the user is asking about homework.",    [](https://openai.github.io/openai-agents-python/quickstart/#__codelineno-8-12)    output_type=HomeworkOutput, [](https://openai.github.io/openai-agents-python/quickstart/#__codelineno-8-13)) [](https://openai.github.io/openai-agents-python/quickstart/#__codelineno-8-14)[](https://openai.github.io/openai-agents-python/quickstart/#__codelineno-8-15)async def homework_guardrail(ctx, agent, input_data):     [](https://openai.github.io/openai-agents-python/quickstart/#__codelineno-8-16)    result = await Runner.run(guardrail_agent, input_data, context=ctx.context)    [](https://openai.github.io/openai-agents-python/quickstart/#__codelineno-8-17)    final_output = result.final_output_as(HomeworkOutput)    [](https://openai.github.io/openai-agents-python/quickstart/#__codelineno-8-18)    return GuardrailFunctionOutput(        [](https://openai.github.io/openai-agents-python/quickstart/#__codelineno-8-19)        output_info=final_output,        [](https://openai.github.io/openai-agents-python/quickstart/#__codelineno-8-20)        tripwire_triggered=not final_output.is_homework,    [](https://openai.github.io/openai-agents-python/quickstart/#__codelineno-8-21)    )`

## Put it all together

Let's put it all together and run the entire workflow, using handoffs and the input guardrail.

`[](https://openai.github.io/openai-agents-python/quickstart/#__codelineno-9-1)from agents import Agent, InputGuardrail, GuardrailFunctionOutput, Runner [](https://openai.github.io/openai-agents-python/quickstart/#__codelineno-9-2)from agents.exceptions import InputGuardrailTripwireTriggered [](https://openai.github.io/openai-agents-python/quickstart/#__codelineno-9-3)from pydantic import BaseModel [](https://openai.github.io/openai-agents-python/quickstart/#__codelineno-9-4)import asyncio [](https://openai.github.io/openai-agents-python/quickstart/#__codelineno-9-5)[](https://openai.github.io/openai-agents-python/quickstart/#__codelineno-9-6)class HomeworkOutput(BaseModel):     [](https://openai.github.io/openai-agents-python/quickstart/#__codelineno-9-7)    is_homework: bool    [](https://openai.github.io/openai-agents-python/quickstart/#__codelineno-9-8)    reasoning: str [](https://openai.github.io/openai-agents-python/quickstart/#__codelineno-9-9)[](https://openai.github.io/openai-agents-python/quickstart/#__codelineno-9-10)guardrail_agent = Agent(     [](https://openai.github.io/openai-agents-python/quickstart/#__codelineno-9-11)    name="Guardrail check",    [](https://openai.github.io/openai-agents-python/quickstart/#__codelineno-9-12)    instructions="Check if the user is asking about homework.",    [](https://openai.github.io/openai-agents-python/quickstart/#__codelineno-9-13)    output_type=HomeworkOutput, [](https://openai.github.io/openai-agents-python/quickstart/#__codelineno-9-14)) [](https://openai.github.io/openai-agents-python/quickstart/#__codelineno-9-15)[](https://openai.github.io/openai-agents-python/quickstart/#__codelineno-9-16)math_tutor_agent = Agent(     [](https://openai.github.io/openai-agents-python/quickstart/#__codelineno-9-17)    name="Math Tutor",    [](https://openai.github.io/openai-agents-python/quickstart/#__codelineno-9-18)    handoff_description="Specialist agent for math questions",    [](https://openai.github.io/openai-agents-python/quickstart/#__codelineno-9-19)    instructions="You provide help with math problems. Explain your reasoning at each step and include examples", [](https://openai.github.io/openai-agents-python/quickstart/#__codelineno-9-20)) [](https://openai.github.io/openai-agents-python/quickstart/#__codelineno-9-21)[](https://openai.github.io/openai-agents-python/quickstart/#__codelineno-9-22)history_tutor_agent = Agent(     [](https://openai.github.io/openai-agents-python/quickstart/#__codelineno-9-23)    name="History Tutor",    [](https://openai.github.io/openai-agents-python/quickstart/#__codelineno-9-24)    handoff_description="Specialist agent for historical questions",    [](https://openai.github.io/openai-agents-python/quickstart/#__codelineno-9-25)    instructions="You provide assistance with historical queries. Explain important events and context clearly.", [](https://openai.github.io/openai-agents-python/quickstart/#__codelineno-9-26)) [](https://openai.github.io/openai-agents-python/quickstart/#__codelineno-9-27) [](https://openai.github.io/openai-agents-python/quickstart/#__codelineno-9-28)[](https://openai.github.io/openai-agents-python/quickstart/#__codelineno-9-29)async def homework_guardrail(ctx, agent, input_data):     [](https://openai.github.io/openai-agents-python/quickstart/#__codelineno-9-30)    result = await Runner.run(guardrail_agent, input_data, context=ctx.context)    [](https://openai.github.io/openai-agents-python/quickstart/#__codelineno-9-31)    final_output = result.final_output_as(HomeworkOutput)    [](https://openai.github.io/openai-agents-python/quickstart/#__codelineno-9-32)    return GuardrailFunctionOutput(        [](https://openai.github.io/openai-agents-python/quickstart/#__codelineno-9-33)        output_info=final_output,        [](https://openai.github.io/openai-agents-python/quickstart/#__codelineno-9-34)        tripwire_triggered=not final_output.is_homework,    [](https://openai.github.io/openai-agents-python/quickstart/#__codelineno-9-35)    ) [](https://openai.github.io/openai-agents-python/quickstart/#__codelineno-9-36)[](https://openai.github.io/openai-agents-python/quickstart/#__codelineno-9-37)triage_agent = Agent(     [](https://openai.github.io/openai-agents-python/quickstart/#__codelineno-9-38)    name="Triage Agent",    [](https://openai.github.io/openai-agents-python/quickstart/#__codelineno-9-39)    instructions="You determine which agent to use based on the user's homework question",    [](https://openai.github.io/openai-agents-python/quickstart/#__codelineno-9-40)    handoffs=[history_tutor_agent, math_tutor_agent],    [](https://openai.github.io/openai-agents-python/quickstart/#__codelineno-9-41)    input_guardrails=[        [](https://openai.github.io/openai-agents-python/quickstart/#__codelineno-9-42)        InputGuardrail(guardrail_function=homework_guardrail),    [](https://openai.github.io/openai-agents-python/quickstart/#__codelineno-9-43)    ], [](https://openai.github.io/openai-agents-python/quickstart/#__codelineno-9-44)) [](https://openai.github.io/openai-agents-python/quickstart/#__codelineno-9-45)[](https://openai.github.io/openai-agents-python/quickstart/#__codelineno-9-46)async def main():     [](https://openai.github.io/openai-agents-python/quickstart/#__codelineno-9-47)    # Example 1: History question    [](https://openai.github.io/openai-agents-python/quickstart/#__codelineno-9-48)    try:        [](https://openai.github.io/openai-agents-python/quickstart/#__codelineno-9-49)        result = await Runner.run(triage_agent, "who was the first president of the united states?")        [](https://openai.github.io/openai-agents-python/quickstart/#__codelineno-9-50)        print(result.final_output)    [](https://openai.github.io/openai-agents-python/quickstart/#__codelineno-9-51)    except InputGuardrailTripwireTriggered as e:        [](https://openai.github.io/openai-agents-python/quickstart/#__codelineno-9-52)        print("Guardrail blocked this input:", e) [](https://openai.github.io/openai-agents-python/quickstart/#__codelineno-9-53)    [](https://openai.github.io/openai-agents-python/quickstart/#__codelineno-9-54)    # Example 2: General/philosophical question    [](https://openai.github.io/openai-agents-python/quickstart/#__codelineno-9-55)    try:        [](https://openai.github.io/openai-agents-python/quickstart/#__codelineno-9-56)        result = await Runner.run(triage_agent, "What is the meaning of life?")        [](https://openai.github.io/openai-agents-python/quickstart/#__codelineno-9-57)        print(result.final_output)    [](https://openai.github.io/openai-agents-python/quickstart/#__codelineno-9-58)    except InputGuardrailTripwireTriggered as e:        [](https://openai.github.io/openai-agents-python/quickstart/#__codelineno-9-59)        print("Guardrail blocked this input:", e) [](https://openai.github.io/openai-agents-python/quickstart/#__codelineno-9-60)[](https://openai.github.io/openai-agents-python/quickstart/#__codelineno-9-61)if __name__ == "__main__":     [](https://openai.github.io/openai-agents-python/quickstart/#__codelineno-9-62)    asyncio.run(main())`

## View your traces

To review what happened during your agent run, navigate to the [Trace viewer in the OpenAI Dashboard](https://platform.openai.com/traces) to view traces of your agent runs.

## Next steps

Learn how to build more complex agentic flows:

-   Learn about how to configure [Agents](https://openai.github.io/openai-agents-python/agents/).
-   Learn about [running agents](https://openai.github.io/openai-agents-python/running_agents/).
-   Learn about [tools](https://openai.github.io/openai-agents-python/tools/), [guardrails](https://openai.github.io/openai-agents-python/guardrails/) and [models](https://openai.github.io/openai-agents-python/models/).
 xamples

Check out a variety of sample implementations of the SDK in the examples section of the [repo](https://github.com/openai/openai-agents-python/tree/main/examples). The examples are organized into several categories that demonstrate different patterns and capabilities.

## Categories

-   **[agent\_patterns](https://github.com/openai/openai-agents-python/tree/main/examples/agent_patterns):** Examples in this category illustrate common agent design patterns, such as
    -   Deterministic workflows
    -   Agents as tools
    -   Parallel agent execution
    -   Conditional tool usage
    -   Input/output guardrails
    -   LLM as a judge
    -   Routing
    -   Streaming guardrails
-   **[basic](https://github.com/openai/openai-agents-python/tree/main/examples/basic):** These examples showcase foundational capabilities of the SDK, such as
    -   Hello world examples (Default model, GPT-5, open-weight model)
    -   Agent lifecycle management
    -   Dynamic system prompts
    -   Streaming outputs (text, items, function call args)
    -   Prompt templates
    -   File handling (local and remote, images and PDFs)
    -   Usage tracking
    -   Non-strict output types
    -   Previous response ID usage
-   **[customer\_service](https://github.com/openai/openai-agents-python/tree/main/examples/customer_service):** Example customer service system for an airline.
-   **[financial\_research\_agent](https://github.com/openai/openai-agents-python/tree/main/examples/financial_research_agent):** A financial research agent that demonstrates structured research workflows with agents and tools for financial data analysis.
-   **[handoffs](https://github.com/openai/openai-agents-python/tree/main/examples/handoffs):** See practical examples of agent handoffs with message filtering.
-   **[hosted\_mcp](https://github.com/openai/openai-agents-python/tree/main/examples/hosted_mcp):** Examples demonstrating how to use hosted MCP (Model Context Protocol) connectors and approvals.
-   **[mcp](https://github.com/openai/openai-agents-python/tree/main/examples/mcp):** Learn how to build agents with MCP (Model Context Protocol), including:
    -   Filesystem examples
    -   Git examples
    -   MCP prompt server examples
    -   SSE (Server-Sent Events) examples
    -   Streamable HTTP examples
-   **[memory](https://github.com/openai/openai-agents-python/tree/main/examples/memory):** Examples of different memory implementations for agents, including:
    -   SQLite session storage
    -   Advanced SQLite session storage
    -   Redis session storage
    -   SQLAlchemy session storage
    -   Encrypted session storage
    -   OpenAI session storage
-   **[model\_providers](https://github.com/openai/openai-agents-python/tree/main/examples/model_providers):** Explore how to use non-OpenAI models with the SDK, including custom providers and LiteLLM integration.
-   **[realtime](https://github.com/openai/openai-agents-python/tree/main/examples/realtime):** Examples showing how to build real-time experiences using the SDK, including:
    -   Web applications
    -   Command-line interfaces
    -   Twilio integration
-   **[reasoning\_content](https://github.com/openai/openai-agents-python/tree/main/examples/reasoning_content):** Examples demonstrating how to work with reasoning content and structured outputs.
-   **[research\_bot](https://github.com/openai/openai-agents-python/tree/main/examples/research_bot):** Simple deep research clone that demonstrates complex multi-agent research workflows.
-   **[tools](https://github.com/openai/openai-agents-python/tree/main/examples/tools):** Learn how to implement OAI hosted tools such as:
    -   Web search and web search with filters
    -   File search
    -   Code interpreter
    -   Computer use
    -   Image generation
-   **[voice](https://github.com/openai/openai-agents-python/tree/main/examples/voice):** See examples of voice agents, using our TTS and STT models, including streamed voice examples.
Tools
Tools let agents take actions: things like fetching data, running code, calling external APIs, and even using a computer. There are three classes of tools in the Agent SDK:

Hosted tools: these run on LLM servers alongside the AI models. OpenAI offers retrieval, web search and computer use as hosted tools.
Function calling: these allow you to use any Python function as a tool.
Agents as tools: this allows you to use an agent as a tool, allowing Agents to call other agents without handing off to them.
Hosted tools
OpenAI offers a few built-in tools when using the OpenAIResponsesModel:

The WebSearchTool lets an agent search the web.
The FileSearchTool allows retrieving information from your OpenAI Vector Stores.
The ComputerTool allows automating computer use tasks.
The CodeInterpreterTool lets the LLM execute code in a sandboxed environment.
The HostedMCPTool exposes a remote MCP server's tools to the model.
The ImageGenerationTool generates images from a prompt.
The LocalShellTool runs shell commands on your machine.

from agents import Agent, FileSearchTool, Runner, WebSearchTool

agent = Agent(
    name="Assistant",
    tools=[
        WebSearchTool(),
        FileSearchTool(
            max_num_results=3,
            vector_store_ids=["VECTOR_STORE_ID"],
        ),
    ],
)

async def main():
    result = await Runner.run(agent, "Which coffee shop should I go to, taking into account my preferences and the weather today in SF?")
    print(result.final_output)
Function tools
You can use any Python function as a tool. The Agents SDK will setup the tool automatically:

The name of the tool will be the name of the Python function (or you can provide a name)
Tool description will be taken from the docstring of the function (or you can provide a description)
The schema for the function inputs is automatically created from the function's arguments
Descriptions for each input are taken from the docstring of the function, unless disabled
We use Python's inspect module to extract the function signature, along with griffe to parse docstrings and pydantic for schema creation.


import json

from typing_extensions import TypedDict, Any

from agents import Agent, FunctionTool, RunContextWrapper, function_tool


class Location(TypedDict):
    lat: float
    long: float

@function_tool  
async def fetch_weather(location: Location) -> str:
    
    """Fetch the weather for a given location.

    Args:
        location: The location to fetch the weather for.
    """
    # In real life, we'd fetch the weather from a weather API
    return "sunny"


@function_tool(name_override="fetch_data")  
def read_file(ctx: RunContextWrapper[Any], path: str, directory: str | None = None) -> str:
    """Read the contents of a file.

    Args:
        path: The path to the file to read.
        directory: The directory to read the file from.
    """
    # In real life, we'd read the file from the file system
    return "<file contents>"


agent = Agent(
    name="Assistant",
    tools=[fetch_weather, read_file],  
)

for tool in agent.tools:
    if isinstance(tool, FunctionTool):
        print(tool.name)
        print(tool.description)
        print(json.dumps(tool.params_json_schema, indent=2))
        print()
Expand to see output
Returning images or files from function tools
In addition to returning text outputs, you can return one or many images or files as the output of a function tool. To do so, you can return any of:

Images: ToolOutputImage (or the TypedDict version, ToolOutputImageDict)
Files: ToolOutputFileContent (or the TypedDict version, ToolOutputFileContentDict)
Text: either a string or stringable objects, or ToolOutputText (or the TypedDict version, ToolOutputTextDict)
Custom function tools
Sometimes, you don't want to use a Python function as a tool. You can directly create a FunctionTool if you prefer. You'll need to provide:

name
description
params_json_schema, which is the JSON schema for the arguments
on_invoke_tool, which is an async function that receives a ToolContext and the arguments as a JSON string, and must return the tool output as a string.

from typing import Any

from pydantic import BaseModel

from agents import RunContextWrapper, FunctionTool



def do_some_work(data: str) -> str:
    return "done"


class FunctionArgs(BaseModel):
    username: str
    age: int


async def run_function(ctx: RunContextWrapper[Any], args: str) -> str:
    parsed = FunctionArgs.model_validate_json(args)
    return do_some_work(data=f"{parsed.username} is {parsed.age} years old")


tool = FunctionTool(
    name="process_user",
    description="Processes extracted user data",
    params_json_schema=FunctionArgs.model_json_schema(),
    on_invoke_tool=run_function,
)
Automatic argument and docstring parsing
As mentioned before, we automatically parse the function signature to extract the schema for the tool, and we parse the docstring to extract descriptions for the tool and for individual arguments. Some notes on that:

The signature parsing is done via the inspect module. We use type annotations to understand the types for the arguments, and dynamically build a Pydantic model to represent the overall schema. It supports most types, including Python primitives, Pydantic models, TypedDicts, and more.
We use griffe to parse docstrings. Supported docstring formats are google, sphinx and numpy. We attempt to automatically detect the docstring format, but this is best-effort and you can explicitly set it when calling function_tool. You can also disable docstring parsing by setting use_docstring_info to False.
The code for the schema extraction lives in agents.function_schema.

Agents as tools
In some workflows, you may want a central agent to orchestrate a network of specialized agents, instead of handing off control. You can do this by modeling agents as tools.


from agents import Agent, Runner
import asyncio

spanish_agent = Agent(
    name="Spanish agent",
    instructions="You translate the user's message to Spanish",
)

french_agent = Agent(
    name="French agent",
    instructions="You translate the user's message to French",
)

orchestrator_agent = Agent(
    name="orchestrator_agent",
    instructions=(
        "You are a translation agent. You use the tools given to you to translate."
        "If asked for multiple translations, you call the relevant tools."
    ),
    tools=[
        spanish_agent.as_tool(
            tool_name="translate_to_spanish",
            tool_description="Translate the user's message to Spanish",
        ),
        french_agent.as_tool(
            tool_name="translate_to_french",
            tool_description="Translate the user's message to French",
        ),
    ],
)

async def main():
    result = await Runner.run(orchestrator_agent, input="Say 'Hello, how are you?' in Spanish.")
    print(result.final_output)
Customizing tool-agents
The agent.as_tool function is a convenience method to make it easy to turn an agent into a tool. It doesn't support all configuration though; for example, you can't set max_turns. For advanced use cases, use Runner.run directly in your tool implementation:


@function_tool
async def run_my_agent() -> str:
    """A tool that runs the agent with custom configs"""

    agent = Agent(name="My agent", instructions="...")

    result = await Runner.run(
        agent,
        input="...",
        max_turns=5,
        run_config=...
    )

    return str(result.final_output)
Custom output extraction
In certain cases, you might want to modify the output of the tool-agents before returning it to the central agent. This may be useful if you want to:

Extract a specific piece of information (e.g., a JSON payload) from the sub-agent's chat history.
Convert or reformat the agent’s final answer (e.g., transform Markdown into plain text or CSV).
Validate the output or provide a fallback value when the agent’s response is missing or malformed.
You can do this by supplying the custom_output_extractor argument to the as_tool method:


async def extract_json_payload(run_result: RunResult) -> str:
    # Scan the agent’s outputs in reverse order until we find a JSON-like message from a tool call.
    for item in reversed(run_result.new_items):
        if isinstance(item, ToolCallOutputItem) and item.output.strip().startswith("{"):
            return item.output.strip()
    # Fallback to an empty JSON object if nothing was found
    return "{}"


json_tool = data_agent.as_tool(
    tool_name="get_data_json",
    tool_description="Run the data agent and return only its JSON payload",
    custom_output_extractor=extract_json_payload,
)
Conditional tool enabling
You can conditionally enable or disable agent tools at runtime using the is_enabled parameter. This allows you to dynamically filter which tools are available to the LLM based on context, user preferences, or runtime conditions.


import asyncio
from agents import Agent, AgentBase, Runner, RunContextWrapper
from pydantic import BaseModel

class LanguageContext(BaseModel):
    language_preference: str = "french_spanish"

def french_enabled(ctx: RunContextWrapper[LanguageContext], agent: AgentBase) -> bool:
    """Enable French for French+Spanish preference."""
    return ctx.context.language_preference == "french_spanish"

# Create specialized agents
spanish_agent = Agent(
    name="spanish_agent",
    instructions="You respond in Spanish. Always reply to the user's question in Spanish.",
)

french_agent = Agent(
    name="french_agent",
    instructions="You respond in French. Always reply to the user's question in French.",
)

# Create orchestrator with conditional tools
orchestrator = Agent(
    name="orchestrator",
    instructions=(
        "You are a multilingual assistant. You use the tools given to you to respond to users. "
        "You must call ALL available tools to provide responses in different languages. "
        "You never respond in languages yourself, you always use the provided tools."
    ),
    tools=[
        spanish_agent.as_tool(
            tool_name="respond_spanish",
            tool_description="Respond to the user's question in Spanish",
            is_enabled=True,  # Always enabled
        ),
        french_agent.as_tool(
            tool_name="respond_french",
            tool_description="Respond to the user's question in French",
            is_enabled=french_enabled,
        ),
    ],
)

async def main():
    context = RunContextWrapper(LanguageContext(language_preference="french_spanish"))
    result = await Runner.run(orchestrator, "How are you?", context=context.context)
    print(result.final_output)

asyncio.run(main())
The is_enabled parameter accepts:

Boolean values: True (always enabled) or False (always disabled)
Callable functions: Functions that take (context, agent) and return a boolean
Async functions: Async functions for complex conditional logic
Disabled tools are completely hidden from the LLM at runtime, making this useful for:

Feature gating based on user permissions
Environment-specific tool availability (dev vs prod)
A/B testing different tool configurations
Dynamic tool filtering based on runtime state
Handling errors in function tools
When you create a function tool via @function_tool, you can pass a failure_error_function. This is a function that provides an error response to the LLM in case the tool call crashes.

By default (i.e. if you don't pass anything), it runs a default_tool_error_function which tells the LLM an error occurred.
If you pass your own error function, it runs that instead, and sends the response to the LLM.
If you explicitly pass None, then any tool call errors will be re-raised for you to handle. This could be a ModelBehaviorError if the model produced invalid JSON, or a UserError if your code crashed, etc.

from agents import function_tool, RunContextWrapper
from typing import Any

def my_custom_error_function(context: RunContextWrapper[Any], error: Exception) -> str:
    """A custom function to provide a user-friendly error message."""
    print(f"A tool call failed with the following error: {error}")
    return "An internal server error occurred. Please try again later."

@function_tool(failure_error_function=my_custom_error_function)
def get_user_profile(user_id: str) -> str:
    """Fetches a user profile from a mock API.
     This function demonstrates a 'flaky' or failing API call.
    """
    if user_id == "user_123":
        return "User profile for user_123 successfully retrieved."
    else:
        raise ValueError(f"Could not retrieve profile for user_id: {user_id}. API returned an error.")
If you are manually creating a FunctionTool object, then you must handle errors inside the on_invoke_tool function.
Model settings
ModelSettings
Settings to use when calling an LLM.

This class holds optional model configuration parameters (e.g. temperature, top_p, penalties, truncation, etc.).

Not all models/providers support all of these parameters, so please check the API documentation for the specific model and provider you are using.

Source code in src/agents/model_settings.py
temperature class-attribute instance-attribute

temperature: float | None = None
The temperature to use when calling the model.

top_p class-attribute instance-attribute

top_p: float | None = None
The top_p to use when calling the model.

frequency_penalty class-attribute instance-attribute

frequency_penalty: float | None = None
The frequency penalty to use when calling the model.

presence_penalty class-attribute instance-attribute

presence_penalty: float | None = None
The presence penalty to use when calling the model.

tool_choice class-attribute instance-attribute

tool_choice: ToolChoice | None = None
The tool choice to use when calling the model.

parallel_tool_calls class-attribute instance-attribute

parallel_tool_calls: bool | None = None
Controls whether the model can make multiple parallel tool calls in a single turn. If not provided (i.e., set to None), this behavior defers to the underlying model provider's default. For most current providers (e.g., OpenAI), this typically means parallel tool calls are enabled (True). Set to True to explicitly enable parallel tool calls, or False to restrict the model to at most one tool call per turn.

truncation class-attribute instance-attribute

truncation: Literal['auto', 'disabled'] | None = None
The truncation strategy to use when calling the model. See Responses API documentation for more details.

max_tokens class-attribute instance-attribute

max_tokens: int | None = None
The maximum number of output tokens to generate.

reasoning class-attribute instance-attribute

reasoning: Reasoning | None = None
Configuration options for reasoning models.

verbosity class-attribute instance-attribute

verbosity: Literal['low', 'medium', 'high'] | None = None
Constrains the verbosity of the model's response.

metadata class-attribute instance-attribute

metadata: dict[str, str] | None = None
Metadata to include with the model response call.

store class-attribute instance-attribute

store: bool | None = None
Whether to store the generated model response for later retrieval. For Responses API: automatically enabled when not specified. For Chat Completions API: disabled when not specified.

include_usage class-attribute instance-attribute

include_usage: bool | None = None
Whether to include usage chunk. Only available for Chat Completions API.

response_include class-attribute instance-attribute

response_include: list[ResponseIncludable | str] | None = (
    None
)
Additional output data to include in the model response. include parameter

top_logprobs class-attribute instance-attribute

top_logprobs: int | None = None
Number of top tokens to return logprobs for. Setting this will automatically include "message.output_text.logprobs" in the response.

extra_query class-attribute instance-attribute

extra_query: Query | None = None
Additional query fields to provide with the request. Defaults to None if not provided.

extra_body class-attribute instance-attribute

extra_body: Body | None = None
Additional body fields to provide with the request. Defaults to None if not provided.

extra_headers class-attribute instance-attribute

extra_headers: Headers | None = None
Additional headers to provide with the request. Defaults to None if not provided.

extra_args class-attribute instance-attribute

extra_args: dict[str, Any] | None = None
Arbitrary keyword arguments to pass to the model API call. These will be passed directly to the underlying model provider's API. Use with caution as not all models support all parameters.

resolve

resolve(override: ModelSettings | None) -> ModelSettings
Produce a new ModelSettings by overlaying any non-None values from the override on top of this instance.

Source code in src/agents/model_settings.py