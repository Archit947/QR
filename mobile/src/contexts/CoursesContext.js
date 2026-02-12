import React, { createContext, useContext, useState } from 'react';

const CoursesContext = createContext();

export function CoursesProvider({ children }) {
  const [courses, setCourses] = useState([]);

  const addOrUpdateCourse = (course) => {
    setCourses((prev) => {
      // If course with same id exists, update it; else add new
      const idx = prev.findIndex((c) => c.id === course.id);
      if (idx !== -1) {
        const updated = [...prev];
        updated[idx] = course;
        return updated;
      }
      return [course, ...prev];
    });
  };

  return (
    <CoursesContext.Provider value={{ courses, setCourses, addOrUpdateCourse }}>
      {children}
    </CoursesContext.Provider>
  );
}

export function useCourses() {
  return useContext(CoursesContext);
}
