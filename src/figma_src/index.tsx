/*import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import { logger } from 'npm:hono/logger';
import * as kv from './kv_store.tsx';

const app = new Hono();

// Enable CORS for all routes
app.use('*', cors({
  origin: '*',
  allowHeaders: [
    '*'
  ],
  allowMethods: [
    '*'
  ]
}));

// Add logging
app.use('*', logger(console.log));

// Initialize demo data
async function initializeDemoData() {
  try {
    console.log('Checking for existing demo data...');
    // Always try to recreate demo data to ensure it's fresh
    const allUsers = await kv.getByPrefix('dcms:user:');
    console.log('Current users in database:', allUsers.length);
    console.log('Creating/updating demo data...');
    // Create demo users
    const demoUsers = [
      {
        email: 'admin@localhost',
        user: {
          id: 'admin-1',
          email: 'admin@localhost',
          password: 'c1$Vg4unme',
          first_name: 'System',
          last_name: 'Administrator',
          name: 'System Administrator',
          role: 'admin',
          canLogin: true,
          registrationType: 'registered',
          createdAt: new Date().toISOString(),
          lastUpdatedAt: new Date().toISOString()
        }
      },
      {
        email: 'dentist@dentalclinic.com',
        user: {
          id: 'dentist-1',
          email: 'dentist@dentalclinic.com',
          password: 'password123',
          first_name: 'Sarah',
          last_name: 'Johnson',
          name: 'Dr. Sarah Johnson',
          role: 'dentist',
          canLogin: true,
          registrationType: 'registered',
          createdAt: new Date().toISOString(),
          lastUpdatedAt: new Date().toISOString()
        }
      },
      {
        email: 'staff@dentalclinic.com',
        user: {
          id: 'staff-1',
          email: 'staff@dentalclinic.com',
          password: 'password123',
          first_name: 'Mary',
          last_name: 'Chen',
          name: 'Mary Chen',
          role: 'staff',
          canLogin: true,
          registrationType: 'registered',
          createdAt: new Date().toISOString(),
          lastUpdatedAt: new Date().toISOString()
        }
      },
      {
        email: 'patient@example.com',
        user: {
          id: 'patient-1',
          email: 'patient@example.com',
          password: 'password123',
          first_name: 'John',
          last_name: 'Smith',
          name: 'John Smith',
          phone: '(555) 123-4567',
          role: 'patient',
          canLogin: true,
          registrationType: 'registered',
          createdAt: new Date().toISOString(),
          lastUpdatedAt: new Date().toISOString()
        }
      },
      // Add some anonymous patients for demo
      {
        email: 'jane@example.com',
        user: {
          id: 'patient-2',
          email: 'jane@example.com',
          password: null,
          first_name: 'Jane',
          last_name: 'Doe',
          name: 'Jane Doe',
          phone: '(555) 987-6543',
          role: 'patient',
          canLogin: false,
          registrationType: 'anonymous',
          createdAt: new Date().toISOString(),
          lastUpdatedAt: new Date().toISOString()
        }
      },
      {
        email: 'mike@example.com',
        user: {
          id: 'patient-3',
          email: 'mike@example.com',
          password: null,
          first_name: 'Mike',
          last_name: 'Johnson',
          name: 'Mike Johnson',
          phone: '(555) 456-7890',
          role: 'patient',
          canLogin: false,
          registrationType: 'anonymous',
          createdAt: new Date().toISOString(),
          lastUpdatedAt: new Date().toISOString()
        }
      }
    ];
    // Create demo users
    for (const { email, user } of demoUsers){
      await kv.set(`dcms:user:${email}`, user);
      console.log(`Created user: ${email} (${user.role})`);
    }

    console.log('Demo data initialized successfully');
  } catch (error) {
    console.error('Error initializing demo data:', error);
  }
}

// Initialize demo data on startup (don't let failures crash the function)
initializeDemoData().catch((error)=>{
  console.error('Failed to initialize demo data - function will continue:', error);
});

// Simple test endpoint (no database calls)
app.get('/make-server-c89a26e4/test', (c)=>{
  return c.json({
    status: 'working',
    timestamp: new Date().toISOString(),
    message: 'Function deployed successfully'
  });
});

// Server status and timestamp endpoint  
app.get('/make-server-c89a26e4/server-status', (c)=>{
  return c.json({
    status: 'active',
    timestamp: new Date().toISOString(),
    version: 'v2.3-billing-history',
    message: 'Server function is running with billing payment history',
    breakTimes: [
      { start: '12:00', end: '13:00', name: 'Lunch Break' },
      { start: '15:00', end: '15:15', name: 'Merienda' }
    ]
  });
});

// Admin users management endpoints
app.get('/make-server-c89a26e4/admin/users', async (c) => {
  try {
    // Get all users from database
    const allUsers = await kv.getByPrefix('dcms:user:');
    
    // Filter for staff and dentist roles only
    const staffUsers = allUsers
      .filter(user => user.role === 'staff' || user.role === 'dentist')
      .map(user => ({
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        name: user.name || `${user.first_name} ${user.last_name}`.trim(), // Backward compatibility
        role: user.role,
        createdAt: user.createdAt,
        createdBy: user.createdBy || 'System'
      }));

    console.log(`Admin users request - returning ${staffUsers.length} users`);
    
    return c.json({
      success: true,
      users: staffUsers
    });
  } catch (error) {
    console.error('Error fetching admin users:', error);
    return c.json({
      error: 'Failed to fetch users'
    }, 500);
  }
});

app.post('/make-server-c89a26e4/admin/users', async (c) => {
  try {
    const { email, password, first_name, last_name, role, createdByAdmin } = await c.req.json();
    
    // Validate required fields
    if (!email || !password || !first_name || !last_name || !role) {
      return c.json({
        error: 'Email, password, first name, last name, and role are required'
      }, 400);
    }

    // Validate role
    if (!['staff', 'dentist'].includes(role)) {
      return c.json({
        error: 'Role must be either staff or dentist'
      }, 400);
    }

    // Check if user already exists
    const existingUser = await kv.get(`dcms:user:${email}`);
    if (existingUser) {
      return c.json({
        error: 'User with this email already exists'
      }, 409);
    }

    // Create user object
    const fullName = `${first_name} ${last_name}`.trim();
    const userId = `user-${crypto.randomUUID()}`;
    
    const newUser = {
      id: userId,
      email,
      password,
      first_name,
      last_name,
      name: fullName, // Computed field for backward compatibility
      role,
      canLogin: true,
      registrationType: 'admin-created',
      createdBy: createdByAdmin || 'admin',
      createdAt: new Date().toISOString(),
      lastUpdatedAt: new Date().toISOString()
    };

    // Save user to database
    await kv.set(`dcms:user:${email}`, newUser);
    
    console.log(`Admin created ${role} user: ${email} by ${createdByAdmin}`);
    
    return c.json({
      success: true,
      user: {
        ...newUser,
        password: undefined // Don't return password
      }
    });
  } catch (error) {
    console.error('Error creating admin user:', error);
    return c.json({
      error: 'Failed to create user'
    }, 500);
  }
});

// Authentication endpoints
app.post('/make-server-c89a26e4/auth/signup', async (c) => {
  try {
    const { email, password, first_name, last_name, phone, requireEmailValidation, domain } = await c.req.json();
    
    if (!email || !password || !first_name || !last_name) {
      return c.json({
        error: 'Email, password, first name, and last name are required'
      }, 400);
    }

    // Check if user already exists
    const existingUser = await kv.get(`dcms:user:${email}`);
    if (existingUser) {
      return c.json({
        error: 'User with this email already exists'
      }, 409);
    }

    // Create user object with computed name field for backward compatibility
    const fullName = `${first_name} ${last_name}`.trim();
    const userId = `user-${crypto.randomUUID()}`;
    
    const newUser = {
      id: userId,
      email,
      password,
      first_name,
      last_name,
      name: fullName, // Computed field for backward compatibility
      phone: phone || null,
      role: 'patient',
      canLogin: true,
      registrationType: 'registered',
      emailValidated: true,
      createdAt: new Date().toISOString(),
      lastUpdatedAt: new Date().toISOString()
    };

    // Create user immediately
    await kv.set(`dcms:user:${email}`, newUser);
    console.log(`Created user: ${email} (${newUser.role})`);
    
    return c.json({
      success: true,
      user: {
        ...newUser,
        password: undefined // Don't return password
      }
    });
  } catch (error) {
    console.log('Signup error:', error);
    return c.json({
      error: 'Failed to create account'
    }, 500);
  }
});

app.post('/make-server-c89a26e4/auth/login', async (c) => {
  try {
    const { email, password } = await c.req.json();
    
    if (!email || !password) {
      return c.json({
        error: 'Email and password are required'
      }, 400);
    }

    // Get user from database
    const user = await kv.get(`dcms:user:${email}`);
    
    if (!user) {
      return c.json({
        error: 'Invalid email or password'
      }, 401);
    }

    if (!user.canLogin) {
      return c.json({
        error: 'Account is not activated'
      }, 401);
    }

    if (user.password !== password) {
      return c.json({
        error: 'Invalid email or password'
      }, 401);
    }

    console.log(`User logged in: ${email} (${user.role})`);
    
    return c.json({
      success: true,
      user: {
        ...user,
        password: undefined // Don't return password
      }
    });
  } catch (error) {
    console.log('Login error:', error);
    return c.json({
      error: 'Failed to login'
    }, 500);
  }
});

// Billing endpoints
app.post('/make-server-c89a26e4/billing', async (c) => {
  try {
    const billData = await c.req.json();
    
    // Validate required fields
    if (!billData.appointmentId || !billData.patientName || !billData.items || !billData.totalAmount) {
      return c.json({
        error: 'Missing required fields: appointmentId, patientName, items, totalAmount'
      }, 400);
    }

    // Generate bill ID
    const billId = `bill-${crypto.randomUUID()}`;
    const timestamp = new Date().toISOString();
    
    // Create bill with payment history array
    const newBill = {
      id: billId,
      appointmentId: billData.appointmentId,
      patientId: billData.patientId || 'anonymous',
      patientName: billData.patientName,
      patientEmail: billData.patientEmail,
      patientPhone: billData.patientPhone,
      items: billData.items,
      totalAmount: billData.totalAmount,
      paidAmount: billData.paidAmount || 0,
      outstandingBalance: billData.totalAmount - (billData.paidAmount || 0),
      paymentMethod: billData.paymentMethod,
      status: (billData.paidAmount || 0) >= billData.totalAmount ? 'paid' : 
              (billData.paidAmount || 0) > 0 ? 'partial' : 'pending',
      notes: billData.notes || '',
      paymentHistory: [], // Empty array initially
      createdBy: billData.createdBy || 'system',
      createdAt: timestamp,
      updatedAt: timestamp
    };

    // Save bill to database
    await kv.set(`dcms:bill:${billId}`, newBill);
    
    console.log(`Created bill: ${billId} for appointment ${billData.appointmentId}`);
    
    return c.json({
      success: true,
      bill: newBill
    });
  } catch (error) {
    console.error('Error creating bill:', error);
    return c.json({
      error: 'Failed to create bill'
    }, 500);
  }
});

app.get('/make-server-c89a26e4/billing', async (c) => {
  try {
    // Get all bills from database
    const allBills = await kv.getByPrefix('dcms:bill:');
    
    console.log(`Retrieved ${allBills.length} bills`);
    
    return c.json({
      success: true,
      bills: allBills
    });
  } catch (error) {
    console.error('Error fetching bills:', error);
    return c.json({
      error: 'Failed to fetch bills'
    }, 500);
  }
});

app.get('/make-server-c89a26e4/billing/:id', async (c) => {
  try {
    const billId = c.req.param('id');
    
    // Get bill from database
    const bill = await kv.get(`dcms:bill:${billId}`);
    
    if (!bill) {
      return c.json({
        error: 'Bill not found'
      }, 404);
    }
    
    console.log(`Retrieved bill: ${billId}`);
    
    return c.json({
      success: true,
      bill: bill
    });
  } catch (error) {
    console.error('Error fetching bill:', error);
    return c.json({
      error: 'Failed to fetch bill'
    }, 500);
  }
});

app.put('/make-server-c89a26e4/billing/:id', async (c) => {
  try {
    const billId = c.req.param('id');
    const updateData = await c.req.json();
    
    // Get existing bill
    const existingBill = await kv.get(`dcms:bill:${billId}`);
    
    if (!existingBill) {
      return c.json({
        error: 'Bill not found'
      }, 404);
    }

    // Handle payment history updates
    let updatedPaymentHistory = existingBill.paymentHistory || [];
    
    // If there's a new payment, add it to payment history
    if (updateData.newPayment) {
      updatedPaymentHistory.push(updateData.newPayment);
    }

    // Calculate new amounts
    const newPaidAmount = updateData.paidAmount || existingBill.paidAmount;
    const newOutstandingBalance = existingBill.totalAmount - newPaidAmount;
    const newStatus = newPaidAmount >= existingBill.totalAmount ? 'paid' : 
                     newPaidAmount > 0 ? 'partial' : 'pending';

    // Update bill
    const updatedBill = {
      ...existingBill,
      paidAmount: newPaidAmount,
      outstandingBalance: newOutstandingBalance,
      paymentMethod: updateData.paymentMethod || existingBill.paymentMethod,
      status: newStatus,
      notes: updateData.notes !== undefined ? updateData.notes : existingBill.notes,
      paymentHistory: updatedPaymentHistory,
      updatedBy: updateData.updatedBy || 'system',
      updatedAt: new Date().toISOString()
    };

    // Save updated bill
    await kv.set(`dcms:bill:${billId}`, updatedBill);
    
    console.log(`Updated bill: ${billId} - Status: ${newStatus}, Paid: ${newPaidAmount}`);
    
    return c.json({
      success: true,
      bill: updatedBill
    });
  } catch (error) {
    console.error('Error updating bill:', error);
    return c.json({
      error: 'Failed to update bill'
    }, 500);
  }
});

// Start the server
export default app;*/