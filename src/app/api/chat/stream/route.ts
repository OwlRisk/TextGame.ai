import { NextRequest } from 'next/server';
import OpenAI from 'openai';
import { getAuthUserFromRequest } from '@/lib/auth-server';
import {
  deductTokens,
  hasTokens,
  estimatedTokensToCoins,
  estimateTokensFromText,
  estimateChatTokens,
} from '@/lib/tokens';
import { isDatabaseConfigured, isDatabaseError } from '@/lib/db-ready';

// Lazy initialization to avoid errors at module load time
function getOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is not set. Please configure it in your .env file.');
  }
  return new OpenAI({ apiKey });
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(request);
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }

    if (!isDatabaseConfigured()) {
      return new Response(
        JSON.stringify({ error: 'Database not configured. Set DATABASE_URL and run npm run db:setup.' }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      );
    }
    // Check API key first
    if (!process.env.OPENAI_API_KEY) {
      return new Response(
        JSON.stringify({ 
          error: 'OpenAI API key is not configured. Please set OPENAI_API_KEY in your environment variables.' 
        }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }

    type Body = {
      messages?: unknown;
      hostPersonality?: { name?: string; description?: string; personality?: string };
      gameContext?: { template?: string; playerCount?: number; gameName?: string; conversationState?: string; rules?: string };
      maxCompletionTokens?: number;
      systemPrompt?: string;
      preferredModel?: string;
    };
    let body: Body;
    try {
      body = (await request.json()) as Body;
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON body' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    const { messages, hostPersonality, gameContext, maxCompletionTokens, systemPrompt: customSystemPrompt, preferredModel } = body;

    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: 'Messages array is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const openai = getOpenAI();

    // When customSystemPrompt is provided (e.g. in-game host with NEXT_SPEAKER/ASSIGN_ROLE), use it as the full system message.
    let systemMessage: string;
    if (typeof customSystemPrompt === 'string' && customSystemPrompt.trim()) {
      systemMessage = customSystemPrompt.trim();
    } else {
      // Build system message
      // When hostPersonality is present: this is the in-game Host (Echo, Nova, etc.) running the game.
      // When hostPersonality is absent: this is the Game Master chat (design phase only)—neutral identity, no named host.
      systemMessage = hostPersonality
      ? `You are the game Host: ${hostPersonality.name}. ${hostPersonality.description || ''}${hostPersonality.personality ? ` Personality: ${hostPersonality.personality}` : ''} Run the game, narrate phases, and manage turns. Never break character.`
      : `You are the Game Master for a social deduction game platform. Your role is to help the user design the game (rules, template, player count) in this chat. Introduce yourself only as "Game Master"—do not use a character name or Host persona. The Host who will run the game (e.g. Echo, Nova) is chosen separately when they start the game. Be friendly, concise, and helpful.`;

    if (gameContext) {
      systemMessage += `\n\nGame Context:\n`;
      if (gameContext.template) {
        systemMessage += `- Game Template: ${gameContext.template}\n`;
      }
      if (gameContext.playerCount) {
        systemMessage += `- Player Count: ${gameContext.playerCount}\n`;
      }
      if (gameContext.gameName) {
        systemMessage += `- Game Name: ${gameContext.gameName}\n`;
      }
      if (gameContext.conversationState) {
        systemMessage += `- Current State: ${gameContext.conversationState}\n`;
      }
    }
    
    // Always include current rules prominently for AI decision-making
    const currentRules = gameContext?.rules || "";
    systemMessage += `\n\n=== CURRENT GAME RULES (for your reference) ===\n`;
    if (currentRules && currentRules.trim() && currentRules !== "Custom game rules will be defined through conversation") {
      systemMessage += `${currentRules}\n`;
    } else {
      systemMessage += `No rules defined yet.\n`;
    }
    systemMessage += `=== END OF CURRENT RULES ===\n`;

    systemMessage += `\n\nKeep your responses concise, engaging, and helpful. Users are human—keep replies short (a few sentences); don't write long paragraphs. Talk like a real person—whether you use emojis (or not) is entirely up to your character.`;

    if (!hostPersonality) {
      systemMessage += `\n\nContext: This chat is for game setup. The actual game (phases, roles, etc.) runs on a separate screen after the user clicks "Create Game". Use your judgment to guide appropriately.`;
    }
    if (gameContext?.conversationState === "confirmation") {
      systemMessage += `\n\nYou are in the confirmation state. Configuration is complete. A "Create Game" button will appear when the user is ready to proceed—use your judgment to help them get there.`;
    }

    // Only allow rule editing during setup. During gameplay (intro, night, day, etc.), rules are LOCKED.
    const setupStates = ['greeting', 'game-type', 'player-count', 'rules-discussion', 'confirmation', 'completed'];
    const isSetupPhase = gameContext?.conversationState && setupStates.includes(gameContext.conversationState);

    if (!isSetupPhase) {
      systemMessage += `\n\nRULES ARE LOCKED: Rules are decided in GM chat (setup) before the game starts; the Host has NO authority to change rules—only to run the game. Once the game has started, rules are immutable. Do NOT output <EDIT_RULES>, <ADD_TO_RULES>, or <REPLACE_IN_RULES>. Only narrate, manage turns, and run the game—never modify the rules.`;
      systemMessage += `\n\nTalk like a real person in your announcements and narrative. Keep announcements short—one or two sentences often enough; users are human. Whether you use emojis (or not) is entirely up to your character.`;
      systemMessage += `\n\nGAME OVER DETECTION: You must detect when the game has naturally concluded according to the rules (e.g. all werewolves eliminated, mafia exposed, a winner is determined, a final round ends, a puzzle is solved, etc.). When the game is over:\n1. Deliver your final announcement and reveal all roles/results in natural, dramatic narration.\n2. At the very end of your message, append exactly: [GAME_OVER]One sentence summarising the outcome and winner(s).[/GAME_OVER]\nThis tag is invisible to players—it only signals the system to mark the game as finished. Only output it once, when the game is definitively over. Do NOT output it mid-game or speculatively.`;
    }

    if (isSetupPhase) {
      systemMessage += `\n\nRULES ARE DECIDED HERE: In GM chat (this conversation), you and the user decide the game rules. Once the user creates the game and it starts, the Host has NO authority to change rules—only to run the game. So get the rules right here.\n\n`;
      // Add instructions for intelligent rule editing (AI decides how to edit)
      systemMessage += `\n\nCRITICAL: You are an intelligent game rules editor agent. You MUST analyze the current rules above and decide HOW to edit them based on the user's request.\n\n`;
      systemMessage += `IMPORTANT ABOUT RULES FORMAT:\n`;
      systemMessage += `- Rules will be read by an AI Host (LLM) who can understand natural language\n`;
      systemMessage += `- Rules don't need strict formatting or section labels (like OBJECTIVE, PHASES, etc.)\n`;
      systemMessage += `- Write rules in natural, clear language that an AI can understand\n`;
      systemMessage += `- Focus on clarity and completeness, not rigid structure\n`;
      systemMessage += `- You can use natural headings, bullet points, or paragraphs - whatever makes the rules clearest\n\n`;
      systemMessage += `PREFER INCREMENTAL UPDATES: Do NOT rewrite the entire Game Document for small changes. Only output the changed part using ADD_TO_RULES or REPLACE_IN_RULES. Use EDIT_RULES (full document) ONLY when: rules don't exist yet, user picks a new template, or user explicitly asks for a full rewrite.\n\n`;
      systemMessage += `YOUR DECISION PROCESS:\n`;
      systemMessage += `1. Read and understand the CURRENT GAME RULES above\n`;
      systemMessage += `2. Analyze what the user is asking for\n`;
      systemMessage += `3. Decide the BEST editing approach:\n`;
      systemMessage += `   - If rules don't exist or user wants a completely new game → Use EDIT_RULES (full replacement)\n`;
      systemMessage += `   - If user wants to ADD something to existing rules → Use ADD_TO_RULES (output only the new part)\n`;
      systemMessage += `   - If user wants to MODIFY/CHANGE specific content → Use REPLACE_IN_RULES (output only old + new)\n`;
      systemMessage += `   - If changes are extensive or affect multiple parts → Use EDIT_RULES (full replacement)\n`;
      systemMessage += `4. Execute your decision using the appropriate editing tag. Never output the full document when a small edit suffices.\n\n`;
      systemMessage += `EDITING FORMATS (choose the best one for each situation):\n\n`;
      systemMessage += `1. <EDIT_RULES>\n[Complete game rules, clearly described in natural language]\n</EDIT_RULES>\n`;
      systemMessage += `   Use when:\n`;
      systemMessage += `   - No rules exist yet\n`;
      systemMessage += `   - User selects a new game/template\n`;
      systemMessage += `   - Major changes affecting multiple parts\n`;
      systemMessage += `   - Complete rewrite needed\n`;
      systemMessage += `   - Write in natural language - describe the game, roles, phases, win conditions, etc. clearly\n`;
      systemMessage += `   - No need for rigid section labels - just make it clear and comprehensive\n\n`;
      systemMessage += `2. <ADD_TO_RULES section="section description">\n[New content to add]\n</ADD_TO_RULES>\n`;
      systemMessage += `   Use when:\n`;
      systemMessage += `   - User wants to add a new role, phase, or rule\n`;
      systemMessage += `   - Adding to existing rules without changing other content\n`;
      systemMessage += `   - Section can be a natural description like "Roles section" or "Game phases" or just "End of rules"\n\n`;
      systemMessage += `3. <REPLACE_IN_RULES section="section description" old="old content to replace" new="new content">\n</REPLACE_IN_RULES>\n`;
      systemMessage += `   Use when:\n`;
      systemMessage += `   - User wants to modify specific existing content\n`;
      systemMessage += `   - Changing wording, numbers, or specific rules\n`;
      systemMessage += `   - Old content should match what's in current rules\n\n`;
      systemMessage += `DECISION EXAMPLES:\n`;
      systemMessage += `- User: "I want to play Werewolf" + No rules exist → Use <EDIT_RULES> with natural language Werewolf rules\n`;
      systemMessage += `- User: "Add a Seer role" + Rules exist → Use <ADD_TO_RULES section="Roles section"> or <EDIT_RULES> with updated rules\n`;
      systemMessage += `- User: "Change player count to 8" + Rules mention "6 players" → Use <REPLACE_IN_RULES> or <EDIT_RULES>\n`;
      systemMessage += `- User selects "Midnight Impostors" + Rules exist → Use <EDIT_RULES> with complete new rules in natural language\n\n`;
      systemMessage += `CRITICAL SEPARATION:\n`;
      systemMessage += `- Editing tags (<EDIT_RULES>, <ADD_TO_RULES>, <REPLACE_IN_RULES>) are INVISIBLE to the user\n`;
      systemMessage += `- These tags are ONLY for updating the rules panel - they will be automatically removed from your message\n`;
      systemMessage += `- Your conversation message should be natural and conversational - as if the tags don't exist\n`;
      systemMessage += `- Example: You can say "I've updated the rules for you!" while using <EDIT_RULES> tags\n`;
      systemMessage += `- The user will ONLY see your conversational text, NOT the editing tags\n\n`;
      systemMessage += `IMPORTANT:\n`;
      systemMessage += `- ALWAYS analyze current rules before deciding\n`;
      systemMessage += `- Prefer ADD_TO_RULES and REPLACE_IN_RULES over EDIT_RULES—only change what is needed\n`;
      systemMessage += `- Preserve existing content unless user explicitly wants to change it\n`;
      systemMessage += `- When using EDIT_RULES, write rules in natural, clear language - the AI Host will understand\n`;
      systemMessage += `- Write your conversational response naturally, then add editing tags separately\n`;
      systemMessage += `- The rules panel updates automatically when you use editing tags\n\n`;
      systemMessage += `PACING — YOU DECIDE THE TIME:\n`;
      systemMessage += `- You (the GM) should decide and write the specific time in the rules: per-question time, per-round time, or total game duration. Do not leave it as a vague range or "to be decided"—choose a concrete value (e.g. "45 seconds per question", "2 minutes per round", "30 minutes total") based on game type and user preference.\n`;
      systemMessage += `- For quiz/brain/trivia games, when offering "optimization directions", include "slower pace" as an option; if the user wants slower pace, set longer times (e.g. 60–90 seconds per question, or no speed bonus).\n`;
      systemMessage += `- When writing EDIT_RULES or ADD_TO_RULES, always include your chosen time(s) in the rules text so the Host and players know exactly how long they have.\n\n`;
      systemMessage += `PLAYER CONFIGURATION (NEW FEATURE):\n`;
      systemMessage += `You can now intelligently configure player details based on the game rules!\n\n`;
      systemMessage += `Use this format to configure players:\n`;
      systemMessage += `<CONFIG_PLAYERS>\n`;
      systemMessage += `[\n`;
      systemMessage += `  {"name": "Player Name", "gender": "male/female/other", "personality": "Personality description", "background": "Background story"},\n`;
      systemMessage += `  ...(more players)\n`;
      systemMessage += `]\n`;
      systemMessage += `</CONFIG_PLAYERS>\n\n`;
      systemMessage += `Rules for player configuration:\n`;
      systemMessage += `- Analyze game rules to determine optimal player count\n`;
      systemMessage += `- Generate diverse, culturally appropriate names\n`;
      systemMessage += `- Balance gender distribution (roughly 50/50 unless rules specify)\n`;
      systemMessage += `- Create distinct personalities for each player\n`;
      systemMessage += `- Match player backgrounds to game theme and roles\n`;
      systemMessage += `- Use CONFIG_PLAYERS when rules are set and user is ready to start\n\n`;
      systemMessage += `Example:\n`;
      systemMessage += `User: "Alright, let's start the game!" (after rules are defined)\n`;
      systemMessage += `You respond with:\n`;
      systemMessage += `"Perfect! I've configured 8 players for you with balanced genders and unique personalities. Click the 'Start Game' button to begin!"\n`;
      systemMessage += `<CONFIG_PLAYERS>\n`;
      systemMessage += `[\n`;
      systemMessage += `  {"name": "Alex", "gender": "male", "personality": "Strategic and analytical", "background": "Former detective"},\n`;
      systemMessage += `  {"name": "Sarah", "gender": "female", "personality": "Observant and cautious", "background": "Psychology student"},\n`;
      systemMessage += `  ...(6 more players)\n`;
      systemMessage += `]\n`;
      systemMessage += `</CONFIG_PLAYERS>\n`;

      systemMessage += `\n\nPLAYER COUNT (GM CAN DECIDE):\n`;
      systemMessage += `You can set the number of AI players when the user asks you to decide, or when you recommend a count.\n`;
      systemMessage += `Use: <SET_PLAYER_COUNT>N</SET_PLAYER_COUNT> where N is the number of AI players (user + N = total players).\n`;
      systemMessage += `IMPORTANT: In the game room, there is always an AI Host character (the narrator/game master) in addition to the players. The Host is NOT counted in N.\n`;
      systemMessage += `So the game room will show: 1 Host + N AI players + 1 user = N+2 total characters.\n`;
      systemMessage += `When communicating to the user, always mention the Host. E.g. "I'll configure 8 total players (you + 7 AI), plus the Host who runs the game."\n`;
      systemMessage += `- When a game template is selected, use the template's recommended range (e.g. Werewolf 4-11 AI, Undercover 3-9 AI, Custom 1-19).\n`;
      systemMessage += `- When user says "you decide", "how many?", "recommend", or "up to you", output this tag with your chosen N.\n`;
      systemMessage += `- The tag is invisible to the user; your message should still clearly state the breakdown.\n`;
      systemMessage += `- Example: "I think 8 works great for Werewolf! That's you + 7 AI players, plus the Host. <SET_PLAYER_COUNT>7</SET_PLAYER_COUNT>"\n\n`;
      systemMessage += `GAME ROOMS (CHANNELS) — YOU DECIDE:\n`;
      systemMessage += `You decide how many game rooms (channels) the game has. Same-team players often need a private room to communicate (e.g. Werewolves, Mafia).\n`;
      systemMessage += `Each room has a "roomType" that controls its AI behaviour:\n`;
      systemMessage += `  "public"     – everyone can see and speak (default, use for main rooms like General)\n`;
      systemMessage += `  "decision"   – AI-only private room where members confer until they reach a decision (e.g. Werewolves picking a nightly target, Mafia voting on a hit). The result is automatically summarised and fed back to the Host.\n`;
      systemMessage += `  "private_ai" – AI-only private room for open discussion without a required decision outcome (e.g. faction strategy chat, side conversations).\n`;
      systemMessage += `  "broadcast"  – Host-only announcements; players read-only.\n`;
      systemMessage += `Use: <CONFIG_CHANNELS>[{"id":"general","name":"General","roomType":"public"},{"id":"werewolves-only","name":"Werewolves only","roomType":"decision"}]</CONFIG_CHANNELS>\n`;
      systemMessage += `- id: lowercase, hyphenated (e.g. general, werewolves-only, mafia-only). name: display name.\n`;
      systemMessage += `- Always include at least one "public" room (e.g. General) for everyone.\n`;
      systemMessage += `- For werewolf/mafia/social deduction: add a "decision" room for the faction (e.g. "Werewolves only", "Mafia only") so they can secretly pick targets.\n`;
      systemMessage += `- For custom games: read the rules and add rooms if the game has teams or private phases. If no teams, one "General" room is enough.\n`;
      systemMessage += `- Output CONFIG_CHANNELS when rules are set (e.g. with EDIT_RULES or when confirming setup). The tag is invisible to the user.\n\n`;
      systemMessage += `GAME BACKGROUND (merged into Rules):\n`;
      systemMessage += `Background story is written in the Rules section (at the beginning). You decide whether this game needs a background.\n`;
      systemMessage += `- Add background (use <UPDATE_GENERAL>) for narrative/thematic games: werewolf, mafia, detective, escape room, murder mystery, story-driven custom. A short world/premise/atmosphere helps immersion.\n`;
      systemMessage += `- Skip background for purely mechanical or light games: trivia, quick party games, word games, or when the user doesn't care about setting. Do not force it.\n`;
      systemMessage += `- If the user explicitly asks for a background or setting, add one. Otherwise use your judgment.\n`;
      systemMessage += `Use: <UPDATE_GENERAL>\n[Game background—world setting, story premise, atmosphere. One or a few short paragraphs.]\n</UPDATE_GENERAL>\n`;
      systemMessage += `This will be prepended to the Rules. The tag is invisible to the user. Only the GM can set this; the Host cannot change it during the game.\n`;
    }
    }

    const maxTokens = typeof maxCompletionTokens === 'number' && maxCompletionTokens > 0
      ? Math.min(4096, Math.max(256, maxCompletionTokens))
      : 500;
    const systemTokens = estimateTokensFromText(systemMessage);
    const messagesTokens = (messages as { content?: string }[]).reduce(
      (sum, m) => sum + estimateTokensFromText(m?.content ?? ''),
      0
    );
    const totalEstimate = estimateChatTokens(systemTokens, messagesTokens, maxTokens);
    const chatModel = preferredModel || process.env.OPENAI_CHAT_MODEL || 'gpt-5.2';
    const estimatedCoins = estimatedTokensToCoins(totalEstimate, chatModel);
    if (!(await hasTokens(user.id, estimatedCoins))) {
      return new Response(
        JSON.stringify({
          error: 'Insufficient tokens',
          message: 'You need more tokens to continue. Please purchase tokens or upgrade to Pro.',
          code: 'INSUFFICIENT_TOKENS',
        }),
        { status: 402, headers: { 'Content-Type': 'application/json' } }
      );
    }
    await deductTokens(
      user.id,
      estimatedCoins,
      'ai_chat_stream',
      `Chat stream ~${totalEstimate} tokens (estimate)`
    );

    // Format messages for OpenAI
    const formattedMessages = [
      { role: 'system' as const, content: systemMessage },
      ...messages.map((msg: any) => ({
        role: msg.role === 'gm' ? 'assistant' as const : 'user' as const,
        content: msg.content
      }))
    ];

    // Create streaming response
    const stream = await openai.chat.completions.create({
      model: chatModel,
      messages: formattedMessages,
      temperature: 0.8,
      max_completion_tokens: maxTokens,
      stream: true,
    });

    // Create a readable stream
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
            }
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error: any) {
    console.error('OpenAI streaming error:', error);
    if (isDatabaseError(error)) {
      return new Response(
        JSON.stringify({ error: 'Database unavailable. Check DATABASE_URL and that migrations have been run.' }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      );
    }
    let message = error.message || 'Failed to stream AI response';
    if (/connection error|connection refused|ECONNREFUSED|ENOTFOUND|ETIMEDOUT/i.test(message)) {
      message = 'Unable to connect to OpenAI. Check your network and OPENAI_API_KEY. You can set OPENAI_CHAT_MODEL=gpt-5.2 in .env if the default model fails.';
    }
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
