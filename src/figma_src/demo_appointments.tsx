    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter = new Date(today);
    dayAfter.setDate(dayAfter.getDate() + 2);
    
    const demoAppointments = [
      {
        id: "9f41f0bb-50d1-4933-b350-8a29e2b4e221",
        patientName: "John Smith",
        patientEmail: "patient@example.com",
        patientPhone: "(555) 123-4567",
        reason: "Routine checkup and cleaning",
        requestedDate: tomorrow.toISOString().split("T")[0],
        requestedTimeSlot: "10:00-11:15",
        date: tomorrow.toISOString().split("T")[0],
        time: "10:00",
        serviceDuration: 60,
        bufferTime: 15,
        dentistName: "Dr. Sarah Johnson",
        status: "booked",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        serviceDetails: [
          {
            id: "sc_1",
            name: "Routine Cleaning",
            duration: 60,
            buffer: 15,
            base_price: 120,
            description: "Comprehensive dental cleaning and oral health examination with plaque and tartar removal"
          }
        ]
      },
      {
        id: "b1922b68-39d7-4f36-9e58-86d7c9e0e1f7",
        patientName: "Jane Doe",
        patientEmail: "jane@example.com",
        patientPhone: "(555) 987-6543",
        reason: "Dental filling",
        requestedDate: dayAfter.toISOString().split("T")[0],
        requestedTimeSlot: "14:00-15:00",
        date: dayAfter.toISOString().split("T")[0],
        time: "14:00",
        serviceDuration: 45,
        bufferTime: 15,
        dentistName: "Dr. Michael Chen",
        status: "booked",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        serviceDetails: [
          {
            id: "sc_2",
            name: "Dental Filling",
            duration: 45,
            buffer: 15,
            base_price: 180,
            description: "Composite or amalgam filling for cavity restoration"
          }
        ]
      },
      {
        id: "c8a8507e-95c5-41d8-b91b-4a2ac09d56d9",
        patientName: "Mike Johnson",
        patientEmail: "mike@example.com",
        patientPhone: "(555) 456-7890",
        reason: "Teeth whitening",
        requestedDate: tomorrow.toISOString().split("T")[0],
        requestedTimeSlot: "13:30-14:45",
        date: tomorrow.toISOString().split("T")[0],
        time: "13:30",
        serviceDuration: 60,
        bufferTime: 15,
        dentistName: "Dr. Sarah Johnson",
        status: "booked",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        serviceDetails: [
          {
            id: "sc_4",
            name: "Teeth Whitening",
            duration: 75,
            buffer: 15,
            base_price: 350,
            description: "Professional teeth whitening treatment for brighter smile"
          }
        ]
      },
      {
        id: "4fdb23af-2b68-492f-9c57-79c3447e86f2",
        patientName: "Sarah Wilson",
        patientEmail: "sarah@example.com",
        patientPhone: "(555) 234-5678",
        reason: "Emergency tooth pain",
        requestedDate: today.toISOString().split("T")[0],
        requestedTimeSlot: "09:00-10:00",
        date: today.toISOString().split("T")[0],
        time: "09:00",
        dentistName: "Dr. Emily Rodriguez",
        status: "cancelled",
        cancellationReason: "no-show",
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString(),
        serviceDetails: [
          {
            id: "sc_5",
            name: "Tooth Extraction",
            duration: 30,
            buffer: 20,
            base_price: 250,
            description: "Surgical or simple removal of damaged or problematic teeth"
          }
        ]
      },
      {
        id: "e97c3790-76d0-4c7c-9a25-9ac3a7a37d88",
        patientName: "Robert Brown",
        patientEmail: "robert@example.com",
        patientPhone: "(555) 345-6789",
        reason: "Dental crown fitting",
        requestedDate: dayAfter.toISOString().split("T")[0],
        requestedTimeSlot: "15:30-16:30",
        date: dayAfter.toISOString().split("T")[0],
        time: "15:30",
        dentistName: "Dr. David Kim",
        status: "cancelled",
        cancellationReason: "patient-cancelled",
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString(),
        serviceDetails: [
          {
            id: "sc_6",
            name: "Dental Crown",
            duration: 120,
            buffer: 30,
            base_price: 950,
            description: "Custom-made crown to restore damaged tooth structure and function"
          }
        ]
      },
      {
        id: "f5a9c4b3-0dc4-4ff1-81e2-ec08c8eb2a4a",
        patientName: "Lisa Garcia",
        patientEmail: "lisa@example.com",
        patientPhone: "(555) 456-7890",
        reason: "Routine cleaning",
        requestedDate: today.toISOString().split("T")[0],
        requestedTimeSlot: "11:00-12:00",
        date: today.toISOString().split("T")[0],
        time: "11:00",
        dentistName: "Dr. Sarah Johnson",
        status: "completed",
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString(),
        serviceDetails: [
          {
            id: "sc_1",
            name: "Routine Cleaning",
            duration: 60,
            buffer: 15,
            base_price: 120,
            description: "Comprehensive dental cleaning and oral health examination with plaque and tartar removal"
          }
        ]
      },
      {
        id: "2a497fc0-0c90-4703-bec3-5d746a9dcff2",
        patientName: "Michael Brown",
        patientEmail: "michael@example.com",
        patientPhone: "(555) 789-0123",
        reason: "Dental filling",
        requestedDate: today.toISOString().split("T")[0],
        requestedTimeSlot: "14:00-15:00",
        date: today.toISOString().split("T")[0],
        time: "14:00",
        dentistName: "Dr. Sarah Johnson",
        status: "completed",
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString(),
        serviceDetails: [
          {
            id: "sc_2",
            name: "Dental Filling",
            duration: 45,
            buffer: 15,
            base_price: 180,
            description: "Composite or amalgam filling for cavity restoration"
          }
        ]
      },
      {
        id: "8d3f4f91-fbd7-4786-a415-83d63f02fef0",
        patientName: "Emily Davis",
        patientEmail: "emily@example.com",
        patientPhone: "(555) 234-5678",
        reason: "Teeth whitening",
        requestedDate: today.toISOString().split("T")[0],
        requestedTimeSlot: "16:00-17:00",
        date: today.toISOString().split("T")[0],
        time: "16:00",
        dentistName: "Dr. Michael Chen",
        status: "completed",
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString(),
        serviceDetails: [
          {
            id: "sc_4",
            name: "Teeth Whitening",
            duration: 75,
            buffer: 15,
            base_price: 350,
            description: "Professional teeth whitening treatment for brighter smile"
          }
        ]
      }
    ];