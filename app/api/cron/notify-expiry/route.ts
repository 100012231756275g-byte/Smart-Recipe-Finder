// app/api/cron/notify-expiry/route.ts
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";



interface Item {
  id: string;
  user_email: string;
  ingredient_name: string;
  amount?: string | null;
  expiry_date: string;
  last_notified?: string | null;
}

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!resend) {
    return NextResponse.json({ error: "No API Key" }, { status: 500 });
  }

  try {
    const today = new Date().toISOString().split("T")[0];
    const target = new Date(Date.now() + 3 * 864e5).toISOString().split("T")[0];

    const { data, error } = await supabase
      .from("user_fridge_items")
      .select("*")
      .lte("expiry_date", target)
      .or(`last_notified.is.null,last_notified.neq.${today}`);

    if (error) throw error;

    const items = (data as Item[]) || [];
    if (items.length === 0) {
      return NextResponse.json({ message: "ไม่มีของใกล้หมดอายุวันนี้" });
    }

   const groups: Record<string, Item[]> = {};
    for (const item of items) {
      groups[item.user_email] = groups[item.user_email] || [];
      groups[item.user_email].push(item);
    }

    const promises = Object.entries(groups).map(([email, userItems]) => {
      const htmlList = userItems
        .map(
          (i: Item) =>
            `<li>${i.ingredient_name} - ${i.amount || "ไม่ระบุจำนวน"} (หมดอายุ: ${i.expiry_date})</li>`
)
.join("");

  return resend.emails.send({
  from: "Cook Cook Alert ",
  to: email,
  subject: "⚠️ มีของใกล้หมดอายุ " + userItems.length + " รายการ",
  html: `<p>คุณมีวัตถุดิบใกล้หมดอายุใน 3 วันข้างหน้า:</p><ul>${htmlList}</ul><p>กรุณาตรวจสอบและใช้วัตถุดิบเหล่านี้ก่อนหมดอายุ</p>`,




});
});


await Promise.all(promises);

const ids = items.map((i: Item) => i.id);
await supabase
  .from("user_fridge_items")
  .update({ last_notified: today })
  .in("id", ids);

return NextResponse.json({ success: true, count: items.length });
} catch (err: unknown) {
const message = err instanceof Error ? err.message : "Error";
return NextResponse.json({ error: message }, { status: 500 });
}
}