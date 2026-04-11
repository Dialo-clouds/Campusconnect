const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database with FUTURE dates...");

  // Delete existing data
  await prisma.submission.deleteMany({});
  await prisma.assignment.deleteMany({});
  await prisma.enrollment.deleteMany({});
  await prisma.course.deleteMany({});

  // Create courses
  const courses = await prisma.course.createMany({
    data: [
      {
        title: "Advanced Web Development",
        code: "CS401",
        description: "Master modern web development with React, Next.js, and Tailwind CSS",
        credits: 3,
        instructor: "Dr. Sarah Johnson",
        capacity: 30,
        enrolled: 0,
        startDate: new Date(),
        endDate: new Date(new Date().setMonth(new Date().getMonth() + 4)),
      },
      {
        title: "Database Design & Management",
        code: "CS402",
        description: "Learn SQL, Prisma ORM, and database architecture",
        credits: 3,
        instructor: "Prof. Michael Chen",
        capacity: 25,
        enrolled: 0,
        startDate: new Date(),
        endDate: new Date(new Date().setMonth(new Date().getMonth() + 4)),
      },
      {
        title: "UI/UX Design Principles",
        code: "CS403",
        description: "Create beautiful and intuitive user interfaces",
        credits: 3,
        instructor: "Emma Davis",
        capacity: 20,
        enrolled: 0,
        startDate: new Date(),
        endDate: new Date(new Date().setMonth(new Date().getMonth() + 4)),
      },
    ],
  });

  console.log(`✅ Created ${courses.count} courses`);

  // Get the created courses
  const allCourses = await prisma.course.findMany();
  
  // Create assignments with FUTURE due dates
  for (const course of allCourses) {
    // Calculate future dates
    const today = new Date();
    const project1Date = new Date();
    project1Date.setDate(today.getDate() + 14); // 14 days from now
    
    const midtermDate = new Date();
    midtermDate.setDate(today.getDate() + 30); // 30 days from now
    
    const finalDate = new Date();
    finalDate.setDate(today.getDate() + 60); // 60 days from now
    
    const assignments = await prisma.assignment.createMany({
      data: [
        {
          title: "Project 1",
          description: "Build a responsive website using React",
          courseId: course.id,
          dueDate: project1Date,
          totalPoints: 100,
        },
        {
          title: "Midterm Exam",
          description: "Comprehensive exam covering all topics",
          courseId: course.id,
          dueDate: midtermDate,
          totalPoints: 100,
        },
        {
          title: "Final Project",
          description: "Complete full-stack application",
          courseId: course.id,
          dueDate: finalDate,
          totalPoints: 200,
        },
      ],
    });
    console.log(`✅ Created ${assignments.count} assignments for ${course.title} with future due dates`);
  }

  console.log("🌱 Seeding complete!");
  console.log("📅 All assignments are due in the FUTURE (14-60 days from now)");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });