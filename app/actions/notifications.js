// actions/notifications.js
"use server";

import { createClient } from "../../lib/supabase/server";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

export async function sendPushNotificationToTeacher(
  teacherMatricule,
  notificationData,
) {
  try {
    const supabase = await createClient();

    // Get teacher's device tokens
    const { data: devices, error } = await supabase
      .from("device_tokens")
      .select("expo_token")
      .eq("user_id", teacherMatricule)
      .order("last_active", { ascending: false });

    if (error || !devices || devices.length === 0) {
      return {
        success: false,
        error: "Teacher not registered for notifications",
      };
    }

    // Send to all devices of this teacher
    const messages = devices.map((device) => ({
      to: device.expo_token,
      sound: "default",
      title: notificationData.title,
      body: notificationData.body,
      data: notificationData.data,
      priority: "high",
    }));

    const responses = await Promise.all(
      messages.map(async (message) => {
        const response = await fetch(EXPO_PUSH_URL, {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify(message),
        });
        return await response.json();
      }),
    );

    // Check for invalid tokens and remove them
    for (let i = 0; i < responses.length; i++) {
      const result = responses[i];
      if (
        result.data?.status === "error" &&
        result.data?.details?.error === "DeviceNotRegistered"
      ) {
        await supabase
          .from("device_tokens")
          .delete()
          .eq("expo_token", messages[i].to);
      }
    }

    // Determine whether at least one message was actually accepted by Expo
    const anySent = responses.some((r) => r.data?.status === "ok");

    if (!anySent) {
      return {
        success: false,
        error: "فشل إرسال الإشعار لجميع الأجهزة",
        responses,
      };
    }

    return { success: true, responses };
  } catch {
    return { success: false, error: "حدث خطأ غير متوقع" };
  }
}

// Save or update device token
export async function registerDeviceToken(
  userId,
  expoToken,
  deviceName = null,
) {
  try {
    const supabase = await createClient();

    // Check if token already exists
    const { data: existing } = await supabase
      .from("device_tokens")
      .select("id")
      .eq("expo_token", expoToken)
      .maybeSingle();

    if (existing) {
      // Update existing token
      const { error } = await supabase
        .from("device_tokens")
        .update({
          last_active: new Date().toISOString(),
          device_name: deviceName,
        })
        .eq("expo_token", expoToken);

      if (error) throw error;
    } else {
      // Insert new token
      const { error } = await supabase.from("device_tokens").insert([
        {
          user_id: userId,
          expo_token: expoToken,
          device_name: deviceName,
          last_active: new Date().toISOString(),
        },
      ]);

      if (error) throw error;
    }

    return { success: true };
  } catch {
    return { success: false, error: "حدث خطأ غير متوقع" };
  }
}

// Remove device token (when user logs out)
export async function removeDeviceToken(expoToken) {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from("device_tokens")
      .delete()
      .eq("expo_token", expoToken);

    if (error) throw error;

    return { success: true };
  } catch {
    return { success: false, error: "حدث خطأ غير متوقع" };
  }
}

// Update last active timestamp
export async function updateDeviceLastActive(expoToken) {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from("device_tokens")
      .update({ last_active: new Date().toISOString() })
      .eq("expo_token", expoToken);

    if (error) throw error;

    return { success: true };
  } catch {
    return { success: false, error: "حدث خطأ غير متوقع" };
  }
}