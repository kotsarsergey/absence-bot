import { Bot, session } from "grammy";
import {
  getUser,
  upsertUser,
  getHistory,
} from "../db/db-service";
import { TELEGRAM_BOT_TOKEN } from "../utils/environment";
import {
  createInitialSessionData,
  MyContext,
} from "./interfaces/custom-context.interface";
import { conversations, createConversation } from "@grammyjs/conversations";
import { registeringConversation } from "./conversations/register-convo";
import { changeNameConversation } from "./conversations/change-name-convo";
import { returnKeyboard } from "./keyboard/keyboard";

const bot = new Bot<MyContext>(TELEGRAM_BOT_TOKEN);
bot.use(session({ initial: () => createInitialSessionData() }));
bot.use(conversations());
bot.use(createConversation(registeringConversation));
bot.use(createConversation(changeNameConversation));
bot.api.setMyCommands([{ command: "start", description: "Запустить бота" }]);

bot.command("start", async (ctx) => {
  let userInfo = await getUser(ctx.msg.chat.id);

  if (!userInfo) {
    userInfo = await upsertUser({
      //@ts-ignore
      id: ctx.msg?.from?.id,
      username: ctx.msg?.from?.username,
      name: `${ctx.msg.from?.first_name} ${ctx.msg.from?.last_name}`,
      isAdmin: false,
      isNotifications: false,
    });
  }

  ctx.session = {
    userId: userInfo.id,
    isAdmin: userInfo.is_admin,
    name: userInfo.name,
    isNotifications: userInfo.is_notifications,
  };

  const helloText = `Добрый день, ${ctx.session.name}`;
  await returnKeyboard(ctx, helloText);
});

bot.callbackQuery("exit", async (ctx) => {
  //@ts-ignore
  await ctx.api.editMessageReplyMarkup(ctx.chat?.id, ctx.msg?.message_id, {
    remove_keyboard: true,
  });
  await ctx.answerCallbackQuery("Хорошего дня!");
  delete ctx.session.userId;
});

bot.callbackQuery("register", async (ctx) => {
  if (!ctx.session.userId) {
    await ctx.answerCallbackQuery("Пожалуйста, выполните команду /start");
    return;
  }
  //@ts-ignore
  await ctx.api.editMessageReplyMarkup(ctx.chat?.id, ctx.msg?.message_id, {
    remove_keyboard: true,
  });
  await ctx.conversation.enter("registeringConversation");
});

bot.callbackQuery("getHistory", async (ctx) => {
  if (!ctx.session.userId) {
    await ctx.answerCallbackQuery("Пожалуйста, выполните команду /start");
    return;
  }
  //@ts-ignore
  await ctx.api.editMessageReplyMarkup(ctx.chat?.id, ctx.msg?.message_id, {
    remove_keyboard: true,
  });

  const history = await getHistory();
  ctx.reply(`${history.length === 0 ? JSON.stringify(history,null,2) : "Записи не найдены"}`);
  await returnKeyboard(ctx, "Меню:");
});

bot.callbackQuery("notifications", async (ctx) => {
  if (!ctx.session.userId) {
    await ctx.answerCallbackQuery("Пожалуйста, выполните команду /start");
    return;
  }

  await upsertUser({
    //@ts-ignore
    id: ctx.session.userId,
    username: ctx.msg?.from?.username,
    name: ctx.session.name,
    isAdmin: ctx.session.isAdmin,
    isNotifications: !ctx.session.isNotifications,
  });

  ctx.session.isNotifications = !ctx.session.isNotifications;

  await ctx.answerCallbackQuery(
    `Уведомления ${ctx.session.isNotifications ? "включены" : "выключены"}`
  );
});

bot.callbackQuery("changeName", async (ctx) => {
  if (!ctx.session.userId) {
    await ctx.answerCallbackQuery("Пожалуйста, выполните команду /start");
    return;
  }
  //@ts-ignore
  await ctx.api.editMessageReplyMarkup(ctx.chat?.id, ctx.msg?.message_id, {
    remove_keyboard: true,
  });
  await ctx.conversation.enter("changeNameConversation");
});

export { bot };
