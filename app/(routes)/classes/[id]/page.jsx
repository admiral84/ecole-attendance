// app/(dashboard)/classes/[id]/page.jsx
import SingleClass from "./SingleClass";
import { getClassById } from "../../../../app/actions/classes";
import { getStudentsByClass } from "../../../../app/actions/students";
import { createClient } from "../../../../lib/supabase/server";
import { notFound, redirect } from "next/navigation";

export default async function Page({ params }) {
  const supabase = await createClient();
  const { id } = await params;

  // ✅ CHECK USER PERMISSIONS FIRST
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  // Get user role
  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("role, user_id, nom, prenom")
    .eq("user_id", user.id)
    .single();

  if (userError || !userData) {
    redirect("/unauthorized");
  }

  // ✅ TEACHER: Check if they have permission to view this class
  if (userData.role === "teacher") {
    const { data: seance, error: seanceError } = await supabase
      .from("seance")
      .select("id")
      .eq("user_id", userData.user_id)
      .eq("id_classe", id)
      .limit(1);

    if (seanceError || !seance || seance.length === 0) {
      notFound();
    }
  }

  // ✅ USE SERVER ACTION to get class info
  const classResult = await getClassById(id);

  if (!classResult.success || !classResult.data) {
    notFound();
  }

  const classInfo = classResult.data;

  // ✅ USE SERVER ACTION to get students
  const studentsResult = await getStudentsByClass(id);

  const rawStudents = studentsResult.success ? studentsResult.data : [];

  // ✅ Remove duplicates
  const uniqueStudents = [];
  const seenIds = new Set();

  for (const student of rawStudents) {
    if (!seenIds.has(student.id_eleve)) {
      seenIds.add(student.id_eleve);
      uniqueStudents.push(student);
    }
  }

  // Fetch active absences (date_fin is null)
  const { data: activeAbsences } = await supabase
    .from("absence")
    .select("id_eleve, date_deb, heure_deb")
    .eq("id_classe", id)
    .is("date_fin", null);

  // Create a map of active absences
  const activeAbsenceMap = new Map();
  activeAbsences?.forEach((absence) => {
    activeAbsenceMap.set(absence.id_eleve, {
      date_deb: absence.date_deb,
      heure_deb: absence.heure_deb,
    });
  });

  // Enhance students with active absence info
  const studentsWithAbsenceInfo = uniqueStudents.map((student) => {
    const activeAbsence = activeAbsenceMap.get(student.id_eleve);
    return {
      ...student,
      hasActiveAbsence: !!activeAbsence,
      absenceStartDate: activeAbsence?.date_deb || null,
      absenceStartTime: activeAbsence?.heure_deb || null,
      present: !activeAbsence,
    };
  });

  // Calculate statistics based on actual absence records
  const totalStudents = studentsWithAbsenceInfo.length;
  const absentStudents = studentsWithAbsenceInfo.filter(
    (s) => s.hasActiveAbsence,
  ).length;
  const presentStudents = totalStudents - absentStudents;

  return (
    <SingleClass
      classInfo={classInfo}
      students={studentsWithAbsenceInfo}
      stats={{
        totalStudents,
        presentStudents,
        absentStudents,
      }}
      userRole={userData.role}
      userInfo={userData}
    />
  );
}