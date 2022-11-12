import { upsertUser } from "../../db/db-service";
import { MyContext, MyConversation } from "../interfaces/custom-context.interface";
import { returnKeyboard } from "../keyboard/keyboard";

export async function changeNameConversation(
    conversation: MyConversation,
    ctx: MyContext
  ) {
    await ctx.reply(
      "Пожалуйста, укажите имя, которое будет указываться в отчетах" +
        "\n_*Важно*_: название аккаунта и ID так же попадают в отчет, так что вам не спрятаться😈",
      { parse_mode: "MarkdownV2" }
    );
    const { message } = await conversation.wait();
  
    await upsertUser({
      id: ctx.session.userId!,
      username: ctx.msg?.from?.username,
      name: message?.text,
      isAdmin: ctx.session.isAdmin,
      isNotifications: !ctx.session.isNotifications,
    });
  
    await ctx.reply(`Введенное имя:*\n${message?.text}*`, {
      parse_mode: "MarkdownV2",
    });
  
    const answer = "Имя обновлено.\n";
  
    await returnKeyboard(ctx, answer);
  
    return;
  }