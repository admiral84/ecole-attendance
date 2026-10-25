
// actions/notifications.js
"use server";

import { createClient } from "../../lib/supabase/server";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";



export async function getNextTeacher(classId) {
  try {
    if (!classId) {
      return {
        success: false,
        message: "classId is required",
        teacherId: null,
        seance: null,
        expoTokens: [],
      };
    }

    const supabase = await createClient();

    const now = new Date();

    const days = [
      "dimanche",
      "lundi",
      "mardi",
      "mercredi",
      "jeudi",
      "vendredi",
      "samedi",
    ];

    const today = days[now.getDay()];
    
    const currentTime = now.toTimeString().slice(0, 8);

    // Get all seances for this class
    const { data: seances, error } = await supabase
      .from("seance")
      .select(`
        id,
        id_classe,
        jour,
        debut_heure,
        fin_heure,
        code_matiere,
        user_id
      `)
      .eq("id_classe", classId)
      .not("user_id", "is", null);

    if (error) {
      console.error("Error fetching seances:", error);

      return {
        success: false,
        message: error.message,
        teacherId: null,
        seance: null,
        expoTokens: [],
      };
    }

    if (!seances || seances.length === 0) {
      return {
        success: false,
        message: "Aucune séance trouvée pour cette classe",
        teacherId: null,
        seance: null,
        expoTokens: [],
      };
    }

    // Only today's seances
    const todaySeances = seances
      .filter((seance) => seance.jour === today)
      .sort((a, b) =>
        a.debut_heure.localeCompare(b.debut_heure)
      );

    if (todaySeances.length === 0) {
      return {
        success: false,
        message: "Aucune séance aujourd'hui",
        teacherId: null,
        seance: null,
        expoTokens: [],
      };
    }

    // --------------------------------------------------
    // 1. Find the seance currently in progress
    // --------------------------------------------------

    let selectedSeance = todaySeances.find(
      (seance) =>
        currentTime >= seance.debut_heure &&
        currentTime < seance.fin_heure
    );

    // --------------------------------------------------
    // 2. If no current seance, find the next one today
    // --------------------------------------------------

    if (!selectedSeance) {
      selectedSeance = todaySeances.find(
        (seance) => seance.debut_heure > currentTime
      );
    }

    // --------------------------------------------------
    // 3. No current or upcoming seance
    // --------------------------------------------------

    if (!selectedSeance) {
      return {
        success: false,
        message: "Aucune séance actuelle ou prochaine aujourd'hui",
        teacherId: null,
        seance: null,
        expoTokens: [],
      };
    }

    // --------------------------------------------------
    // 4. Get teacher from the selected seance
    // --------------------------------------------------

    const teacherId = selectedSeance.user_id;

    if (!teacherId) {
      return {
        success: false,
        message: "Aucun enseignant trouvé",
        teacherId: null,
        seance: selectedSeance,
        expoTokens: [],
      };
    }

    // --------------------------------------------------
    // 5. Get the teacher's device tokens
    // --------------------------------------------------

    const { data: devices, error: deviceError } = await supabase
      .from("device_tokens")
      .select("expo_token")
      .eq("user_id", teacherId);

    if (deviceError) {
      console.error(
        "Error fetching teacher device tokens:",
        deviceError
      );

      return {
        success: false,
        message: deviceError.message,
        teacherId,
        seance: selectedSeance,
        expoTokens: [],
      };
    }

    const expoTokens = (devices || [])
      .map((device) => device.expo_token)
      .filter(Boolean);

    if (expoTokens.length === 0) {
      return {
        success: false,
        message: "Cet enseignant n'a aucun appareil enregistré",
        teacherId,
        seance: selectedSeance,
        expoTokens: [],
      };
    }

    return {
      success: true,
      teacherId,
      seance: selectedSeance,
      expoTokens,
    };
  } catch (error) {
    console.error("Error in getNextTeacher:", error);

    return {
      success: false,
      message: error.message || "Erreur inattendue",
      teacherId: null,
      seance: null,
      expoTokens: [],
    };
  }
}



export async function sendPushNotificationToTeacher(
  teacherMatricule,
  notificationData,
) {
  try {
    if (!teacherMatricule) {
      return {
        success: false,
        error: "Teacher ID is required",
      };
    }

    if (!notificationData?.title || !notificationData?.body) {
      return {
        success: false,
        error: "Notification title and body are required",
      };
    }

    const supabase = await createClient();

    // Get all devices belonging to this teacher.
    const { data: devices, error } = await supabase
      .from("device_tokens")
      .select("expo_token")
      .eq("user_id", teacherMatricule)
      .order("last_active", {
        ascending: false,
      });

    if (error) {
      console.error("Error getting teacher devices:", error);

      return {
        success: false,
        error: error.message,
      };
    }

    if (!devices || devices.length === 0) {
      return {
        success: false,
        error: "Teacher not registered for notifications",
      };
    }

    // Create one Expo message per device.
    const messages = devices.map((device) => ({
      to: device.expo_token,
      sound: "default",
      title: notificationData.title,
      body: notificationData.body,
      data: notificationData.data || {},
      priority: "high",
    }));

    // Send notifications to all devices.
    const responses = await Promise.all(
      messages.map(async (message) => {
        try {
          const response = await fetch(EXPO_PUSH_URL, {
            method: "POST",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
            },
            body: JSON.stringify(message),
          });

          return await response.json();
        } catch (error) {
          return {
            data: {
              status: "error",
              message: error.message,
            },
          };
        }
      }),
    );

    /*
     * Remove invalid Expo tokens.
     */
    for (let i = 0; i < responses.length; i++) {
      const result = responses[i];

      if (
        result?.data?.status === "error" &&
        result?.data?.details?.error === "DeviceNotRegistered"
      ) {
        await supabase
          .from("device_tokens")
          .delete()
          .eq("expo_token", messages[i].to);
      }
    }

    /*
     * Expo accepts a message when:
     *
     * result.data.status === "ok"
     */
    const anySent = responses.some(
      (response) => response?.data?.status === "ok",
    );

    if (!anySent) {
      return {
        success: false,
        error: "فشل إرسال الإشعار لجميع الأجهزة",
        responses,
      };
    }

    return {
      success: true,
      responses,
    };
  } catch (error) {
    console.error("Error sending push notification:", error);

    return {
      success: false,
      error: error.message || "حدث خطأ غير متوقع",
    };
  }
}

/**
 * Find the next teacher for a class
 * and send the notification to that teacher.
 *
 * This is the function you should normally call
 * from your absence/billet actions.
 */
export async function sendNotificationToNextTeacher(
  classId,
  notificationData,
) {
  try {
    // 1. Find the next teacher.
    const nextTeacher = await getNextTeacher(classId);
    console.log("getNextTeacher was called");

    if (!nextTeacher.success || !nextTeacher.teacherId) {
      return {
        success: false,
        error:
          nextTeacher.message ||
          "Aucun prochain enseignant trouvé",
      };
    }

    // 2. Send notification to that teacher.
    const notificationResult =
      await sendPushNotificationToTeacher(
        nextTeacher.teacherId,
        notificationData,
      );

    if (!notificationResult.success) {
      return {
        success: false,
        error: notificationResult.error,
        teacherId: nextTeacher.teacherId,
        seance: nextTeacher.seance,
      };
    }

    return {
      success: true,

      // Useful if the caller wants to know
      // which teacher received the notification.
      teacherId: nextTeacher.teacherId,

      // Useful for logging/debugging.
      seance: nextTeacher.seance,

      notification: notificationResult,
    };
  } catch (error) {
    console.error(
      "Error in sendNotificationToNextTeacher:",
      error,
    );

    return {
      success: false,
      error: error.message || "حدث خطأ غير متوقع",
    };
  }
}

/**
 * Save or update a device token.
 */
export async function registerDeviceToken(
  userId,
  expoToken,
  deviceName = null,
) {
  try {
    if (!userId || !expoToken) {
      return {
        success: false,
        error: "userId and expoToken are required",
      };
    }

    const supabase = await createClient();

    // Check if this Expo token already exists.
    const { data: existing, error: findError } = await supabase
      .from("device_tokens")
      .select("id")
      .eq("expo_token", expoToken)
      .maybeSingle();

    if (findError) {
      throw findError;
    }

    if (existing) {
      // Update existing token.
      const { error } = await supabase
        .from("device_tokens")
        .update({
          user_id: userId,
          last_active: new Date().toISOString(),
          device_name: deviceName,
        })
        .eq("expo_token", expoToken);

      if (error) {
        throw error;
      }
    } else {
      // Insert new token.
      const { error } = await supabase
        .from("device_tokens")
        .insert([
          {
            user_id: userId,
            expo_token: expoToken,
            device_name: deviceName,
            last_active: new Date().toISOString(),
          },
        ]);

      if (error) {
        throw error;
      }
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error registering device token:", error);

    return {
      success: false,
      error: error.message || "حدث خطأ غير متوقع",
    };
  }
}

/**
 * Remove a device token when the user logs out.
 */
export async function removeDeviceToken(expoToken) {
  try {
    if (!expoToken) {
      return {
        success: false,
        error: "expoToken is required",
      };
    }

    const supabase = await createClient();

    const { error } = await supabase
      .from("device_tokens")
      .delete()
      .eq("expo_token", expoToken);

    if (error) {
      throw error;
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error removing device token:", error);

    return {
      success: false,
      error: error.message || "حدث خطأ غير متوقع",
    };
  }
}

/**
 * Update last_active for a device.
 */
export async function updateDeviceLastActive(expoToken) {
  try {
    if (!expoToken) {
      return {
        success: false,
        error: "expoToken is required",
      };
    }

    const supabase = await createClient();

    const { error } = await supabase
      .from("device_tokens")
      .update({
        last_active: new Date().toISOString(),
      })
      .eq("expo_token", expoToken);

    if (error) {
      throw error;
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error(
      "Error updating device last active:",
      error,
    );

    return {
      success: false,
      error: error.message || "حدث خطأ غير متوقع",
    };
  }
}

