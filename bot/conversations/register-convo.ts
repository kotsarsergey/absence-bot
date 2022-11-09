import { getAdmins, insertHistory, User, History } from "../../db/db-service";
import {
  MyContext,
  MyConversation,
} from "../interfaces/custom-context.interface";
import { returnKeyboard } from "../keyboard/keyboard";

async function notifyAllAdmins(
  historyRecord: History,
  user: string,
  ctx: MyContext
) {
  const admins: User[] = await getAdmins();
  console.log(
    `Starting to send notifications to following admins: \n${JSON.stringify(
      admins
    )}`
  );

  const formattedReason = historyRecord.reason.replace(/[.,()?*{};:'"<>`]/g, "\\$");

  if (admins.length > 0) {
    for (let admin of admins) {
      await ctx.api.sendMessage(
        admin.id,
        "Зарегистрировано новое отсутствие:\n" +
          `_*От*_: ${user}\n` +
          `_*Причина*_: ${formattedReason}\n` +
          `_*Дата*_: ${historyRecord.date
            .toLocaleString("ru-RU")
            .replace(/\./g, "\\.")}`,
        { parse_mode: "MarkdownV2" }
      );
    }
  } else {
    console.log("Admins has not been found");
  }

  return true;
}

export async function registeringConversation(
  conversation: MyConversation,
  ctx: MyContext
) {
  let answer:string

  await ctx.reply("Пожалуйста, укажите причину отсутствия: ");
  const { message } = await conversation.wait();

  if (!message) {
    answer = "Вы ввели некорректное значение, попробуйте еще раз чуть позже";
  } else {
    const formattedReason = message.text!.replace(/[.,()?*{};:'"<>`]/g, "\\$&");

    console.log("\naleeeee: ", formattedReason);

    await ctx.reply(`Введенная причина:*\n${formattedReason}*`, {
      parse_mode: "MarkdownV2",
    });

    const historyRecord = await insertHistory({
      user_id: ctx.session.userId!,
      reason: message.text!,
      date: new Date(),
    });

    await notifyAllAdmins(historyRecord, ctx.session.name, ctx);
    answer = "Спасибо за информацию!\nОтветственные лица уведомлены.\n";
  }

  await returnKeyboard(ctx, answer);

  return;
}
