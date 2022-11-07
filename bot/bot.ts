import { Bot, InlineKeyboard, session } from "grammy";
import {
  getUser,
  upsertUser,
  insertHistory,
  User,
  getAdmins,
  History,
} from "../db/db-service";
import { TELEGRAM_BOT_TOKEN } from "../utils/environment";
import {
  createInitialSessionData,
  MyContext,
  MyConversation,
} from "./interfaces/custom-context.interface";
import { conversations, createConversation } from "@grammyjs/conversations";

async function notifyAllAdmins(historyRecord: History, user: string) {
  const admins: User[] = await getAdmins();
  console.log(
    `Starting to send notifications to following admins: \n${JSON.stringify(
      admins
    )}`
  );

  if (admins.length > 0) {
    for (let admin of admins) {
      await bot.api.sendMessage(
        admin.id,
        "Зарегистрировано новое отсутствие:\n" +
          `_*От*_: ${user}\n` +
          `_*Причина*_: ${historyRecord.reason.replace(/\./g, "\\.")}\n` +
          `_*Дата*_: ${historyRecord.date
            .toLocaleString('ru-RU')
            .replace(/\./g, "\\.")}`,
        { parse_mode: "MarkdownV2" }
      );
    }
  } else {
    console.log("Admins has not been found");
  }

  return true;
}

async function registeringConversation(
  conversation: MyConversation,
  ctx: MyContext
) {
  await ctx.reply("Пожалуйста, укажите причину отсутствия: ");
  const { message } = await conversation.wait();
  await ctx.reply(`Введенная причина:*\n${message?.text}*`, {
    parse_mode: "MarkdownV2",
  });

  const historyRecord = await insertHistory({
    //@ts-ignore
    user_id: ctx.session.userId,
    reason: message?.text || "",
    date: new Date(),
  });

  await notifyAllAdmins(historyRecord, ctx.session.name);
  const answer = "Спасибо за информацию!\nОтветственные лица уведомлены.\n";

  if (ctx.session.isAdmin) {
    await ctx.reply(answer, { reply_markup: adminMenu() });
  } else {
    await ctx.reply(answer, { reply_markup: simpleMenu() });
  }

  return;
}

async function changeNameConversation(
  conversation: MyConversation,
  ctx: MyContext
) {
  await ctx.reply(
    "Пожалуйста, укажите имя, которое будет указываться в отчетах" +
      "\n_*Важно*_: имя аккаунта так же попадает в отчет, так что вам не спрятаться😈",
    { parse_mode: "MarkdownV2" }
  );
  const { message } = await conversation.wait();

  await upsertUser({
    //@ts-ignore
    id: ctx.session.userId,
    username: ctx.msg?.from?.username,
    name: message?.text,
    isAdmin: ctx.session.isAdmin,
    isNotifications: !ctx.session.isNotifications,
  });

  await ctx.reply(`Введенное имя:*\n${message?.text}*`, {
    parse_mode: "MarkdownV2",
  });

  const answer = "Имя обновлено.\n";

  if (ctx.session.isAdmin) {
    await ctx.reply(answer, { reply_markup: adminMenu() });
  } else {
    await ctx.reply(answer, { reply_markup: simpleMenu() });
  }

  return;
}

function adminMenu(): InlineKeyboard {
  return simpleMenu()
    .row()
    .text("Включить/выключить уведомления", "notifications")
    .row()
    .text("Получить список прогулов", "getHistory");
}

function simpleMenu(): InlineKeyboard {
  return new InlineKeyboard()
    .text("Зарегистрировать отсутствие", "register")
    .row()
    .text("Поменять имя", "changeName")
    .row()
    .text("Выход", "exit");
}

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
  if (ctx.session.isAdmin) {
    await ctx.reply(helloText, { reply_markup: adminMenu() });
  } else {
    await ctx.reply(helloText, { reply_markup: simpleMenu() });
  }
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
