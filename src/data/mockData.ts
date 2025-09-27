import { User, Appointment, PatientRecord, Service, ServiceCatalogItem } from '../types';

export const mockUsers: User[] = [
  {
    id: '1',
    email: 'admin@dentalclinic.com',
    first_name: 'Sarah',
    last_name: 'Johnson',
    role: 'admin',
    phone: '(555) 123-4567',
    canLogin: true,
    createdAt: '2023-01-15T08:00:00Z',
    birthdate: '1975-03-20',
    address: {
      street: '789 Medical Plaza',
      city: 'Healthcare City',
      state: 'CA',
      zipCode: '90210',
      country: 'United States'
    }
  },
  {
    id: '2',
    email: 'dentist@dentalclinic.com',
    first_name: 'Michael',
    last_name: 'Chen',
    role: 'dentist',
    phone: '(555) 234-5678',
    canLogin: true,
    createdAt: '2023-02-10T09:00:00Z',
    birthdate: '1980-08-15',
    address: {
      street: '456 Dental Avenue',
      city: 'Professional District',
      state: 'CA',
      zipCode: '90211',
      country: 'United States'
    }
  },
  {
    id: '3',
    email: 'patient@example.com',
    first_name: 'John',
    last_name: 'Smith',
    role: 'patient',
    phone: '(555) 345-6789',
    canLogin: true,
    createdAt: '2023-06-01T10:30:00Z',
    birthdate: '1985-06-15',
    address: {
      street: '123 Main St',
      city: 'Hometown',
      state: 'CA',
      zipCode: '90212',
      country: 'United States'
    }
  }
];


export const mockAppointments: Appointment[] = [
  {
    id: '1',
    patientId: '3',
    patientName: 'John Smith',
    patientEmail: 'patient@example.com',
    patientPhone: '(555) 345-6789',
    dentistId: '2',
    dentistName: 'Dr. Michael Chen',
    date: '2025-08-15',
    time: '10:00',
    service: 'Regular Cleaning',
    status: 'booked',
    notes: 'First visit',
    isAnonymous: false,
    reason: "Sample"
  },
  {
    id: '2',
    patientId: 'anonymous-1',
    patientName: 'Jane Doe',
    patientEmail: 'jane.doe@email.com',
    patientPhone: '(555) 456-7890',
    dentistId: '1',
    dentistName: 'Dr. Sarah Johnson',
    date: '2025-08-16',
    time: '14:00',
    service: 'Dental Filling',
    status: 'booked',
    notes: 'Anonymous booking',
    isAnonymous: true,
    reason: "Sample"
  },
  {
    id: '3',
    patientId: '3',
    patientName: 'John Smith',
    patientEmail: 'patient@example.com',
    patientPhone: '(555) 345-6789',
    dentistId: '2',
    dentistName: 'Dr. Michael Chen',
    date: '2025-07-20',
    time: '09:00',
    service: 'Root Canal',
    status: 'completed',
    notes: 'Treatment completed successfully',
    isAnonymous: false,
    reason: "sample"
  }
];

export const mockPatientRecords: PatientRecord[] = [
  {
    id: '1',
    patientId: '3',
    appointmentId: '3',
    date: '2025-07-20',
    treatment: 'Root Canal - Tooth #14',
    diagnosis: 'Deep decay requiring root canal therapy',
    notes: 'Patient responded well to treatment. Prescribed antibiotics.',
    cost: 1200,
    dentistId: '2',
    dentistName: 'Dr. Michael Chen'
  },
  {
    id: '2',
    patientId: '3',
    appointmentId: '1',
    date: '2025-06-15',
    treatment: 'Regular Cleaning and Examination',
    diagnosis: 'Mild gingivitis, overall good oral health',
    notes: 'Recommended improved flossing routine',
    cost: 150,
    dentistId: '2',
    dentistName: 'Dr. Michael Chen'
  }
];

export const mockServices: Service[] = [
  {
    id: '1',
    name: 'Regular Cleaning',
    duration: 60,
    price: 150,
    description: 'Comprehensive dental cleaning and examination'
  },
  {
    id: '2',
    name: 'Dental Filling',
    duration: 90,
    price: 300,
    description: 'Composite or amalgam filling for cavities'
  },
  {
    id: '3',
    name: 'Root Canal',
    duration: 120,
    price: 1200,
    description: 'Root canal therapy for infected teeth'
  },
  {
    id: '4',
    name: 'Teeth Whitening',
    duration: 90,
    price: 400,
    description: 'Professional teeth whitening treatment'
  },
  {
    id: '5',
    name: 'Dental Crown',
    duration: 120,
    price: 900,
    description: 'Custom dental crown placement'
  }
];

export const mockServicesCatalog: ServiceCatalogItem[] = [
  {
    id: 'sc_1',
    name: 'Routine Cleaning',
    description: 'Comprehensive dental cleaning and oral health examination with plaque and tartar removal',
    base_price: 120,
    has_treatment_detail: false,
    estimated_duration: 60,
    buffer_time: 15
  },
  {
    id: 'sc_2',
    name: 'Dental Filling',
    description: 'Composite or amalgam filling for cavity restoration',
    base_price: 180,
    has_treatment_detail: true,
    estimated_duration: 45,
    buffer_time: 15
  },
  {
    id: 'sc_3',
    name: 'Root Canal Treatment',
    description: 'Endodontic therapy to treat infected or severely decayed teeth',
    base_price: 800,
    has_treatment_detail: true,
    estimated_duration: 90,
    buffer_time: 30
  },
  {
    id: 'sc_4',
    name: 'Teeth Whitening',
    description: 'Professional teeth whitening treatment for brighter smile',
    base_price: 350,
    has_treatment_detail: false,
    estimated_duration: 75,
    buffer_time: 15
  },
  {
    id: 'sc_5',
    name: 'Tooth Extraction',
    description: 'Surgical or simple removal of damaged or problematic teeth',
    base_price: 250,
    has_treatment_detail: true,
    estimated_duration: 30,
    buffer_time: 20
  },
  {
    id: 'sc_6',
    name: 'Dental Crown',
    description: 'Custom-made crown to restore damaged tooth structure and function',
    base_price: 950,
    has_treatment_detail: true,
    estimated_duration: 120,
    buffer_time: 30
  },
  {
    id: 'sc_7',
    name: 'Orthodontic Consultation',
    description: 'Initial consultation and assessment for braces or clear aligners',
    base_price: 150,
    has_treatment_detail: false,
    estimated_duration: 45,
    buffer_time: 15
  },
  {
    id: 'sc_8',
    name: 'Dental Bridge',
    description: 'Fixed prosthetic device to replace one or more missing teeth',
    base_price: 1200,
    has_treatment_detail: true,
    estimated_duration: 150,
    buffer_time: 30
  },
  {
    id: 'sc_9',
    name: 'Periodontal Treatment',
    description: 'Deep cleaning and treatment for gum disease and periodontal issues',
    base_price: 300,
    has_treatment_detail: true,
    estimated_duration: 90,
    buffer_time: 20
  },
  {
    id: 'sc_10',
    name: 'Dental Implant',
    description: 'Permanent tooth replacement with titanium implant and crown',
    base_price: 2500,
    has_treatment_detail: true,
    estimated_duration: 180,
    buffer_time: 45
  }
];

export const timeSlots = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'
];