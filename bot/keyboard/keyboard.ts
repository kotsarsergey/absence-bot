import { InlineKeyboard } from "grammy";
import { MyContext } from "../interfaces/custom-context.interface";

export function adminMenu(): InlineKeyboard {
  return simpleMenu()
    .row()
    .text("Включить/выключить уведомления", "notifications")
    .row()
    .text("Получить список прогулов", "getHistory");
}

export function simpleMenu(): InlineKeyboard {
  return new InlineKeyboard()
    .text("Зарегистрировать отсутствие", "register")
    .row()
    .text("Поменять имя", "changeName")
    .row()
    .text("Выход", "exit");
}

export async function returnKeyboard(ctx: MyContext, replyText: string) {
  if (ctx.session.isAdmin) {
    await ctx.reply(replyText, { reply_markup: adminMenu() });
  } else {
    await ctx.reply(replyText, { reply_markup: simpleMenu() });
  }
}
