from flask import Flask,redirect,url_for,render_template,request,jsonify
import mysql.connector
from datetime import timedelta
import datetime

app = Flask(__name__)

# Database configuration
db_config = {
    'user': 'root',
    'password': '**************',
    'host': '127.0.0.1',
    'database': 'cip_db',
    'raise_on_warnings': True
}

# Setup Database connection with the given conguration
def get_db_connection():
    return mysql.connector.connect(**db_config)

'''
    The function "add_patient()" is called from Patient Registration template to add new patient data to database
    when form is submitted.
    Function returns the patient id after registration as json parameter
'''
@app.route('/add', methods=['POST'])
def add_patient():
    status=""
    # fetch data entered in the form elements using their respective id
    name = request.form['full_name']
    age = int(request.form['age'])
    gender = request.form['gender']
    address = request.form['address']
    mobile = int(request.form['mobile'])
    ailment = request.form['ailment']

    #create database connection
    conn = get_db_connection()
    cursor = conn.cursor()

    #checking if patient with the given name and mobile number are already registered
    cursor.execute('SELECT patientid FROM patientdetails where patientname=%s and mobile=%s',(name,mobile))
    check_patient_id = cursor.fetchone()
    '''
        inserting patient data and returning patient id 
        that is auto-generated from the database    
    '''
    if check_patient_id is None:
        cursor.execute('INSERT INTO patientdetails (patientname, age, gender, address, ailment, mobile) VALUES (%s, %s, %s, %s, %s, %s)', (name, age, gender, address, ailment, mobile))
        cursor.execute('SELECT patientid FROM patientdetails where patientname=%s and mobile=%s',(name,mobile))
        patient_id = cursor.fetchone()
        conn.commit()
        status="success"
    else:
        status="failure"
        return jsonify({'patient_id': check_patient_id,'status':status})
    cursor.close()
    conn.close()
    return jsonify({'patient_id': patient_id,'status':status})

'''
    The function "book_appointment()" is called from Appointment Booking template 
    to add new appointment data to database when form is submitted.
    Function returns the appointment time based on the location selected after appointment booking as json parameter
'''
@app.route('/book_appointment', methods=['POST'])
def book_appointment():
    status=""
    # fetch data entered in the form elements using their respective id
    patient_id = int(request.form['patient_id'])
    location = request.form['location']
    appointment_date = request.form['app_date']

    #create database connection
    conn = get_db_connection()
    cursor = conn.cursor()

    # check if patient id is registered 
    cursor.execute('SELECT patientname FROM patientdetails where patientid=%s',(patient_id,))
    check_patient_registered = cursor.fetchone()
    if check_patient_registered is None:
        status="failure"
        return jsonify({'patient_id': patient_id,'status':status})
    else:
        # check if patient has already booked an appointment for the given date
        cursor.execute('SELECT patientid FROM appointment WHERE patientid = %s AND appointmentdate = %s', (patient_id, appointment_date))
        check_patient_appointment = cursor.fetchone()
        if check_patient_appointment is not None:
            status="appointment_exists"
            return jsonify({'patient_id': patient_id,'status':status})
        else:
            '''
                Call the stored procedure for inserting row in Appointment table
                The appointment time is set for the given location and is fetched
             '''
            cursor.callproc('InsertAppointment', [patient_id, location, appointment_date])   
            cursor.execute('SELECT appointmenttime FROM appointment WHERE patientid = %s AND appointmentdate = %s', (patient_id, appointment_date))
            appointment_time = cursor.fetchone()
            # appointment_time is a tuple and manipulated using timedelta library
            if appointment_time:
                appointment_time = appointment_time[0]  # Extract the time part
                if isinstance(appointment_time, timedelta):
                    total_seconds = appointment_time.total_seconds()
                    appointment_time = str(timedelta(seconds=total_seconds))
                else:
                    appointment_time = appointment_time.strftime('%H:%M:%S')

            conn.commit()
            status="success"
    cursor.close()
    conn.close()
    return jsonify({'appointment_time': appointment_time if appointment_time else None,'status':status})

'''
    The function "get_appointment_history()" is called from Appointment History template 
    to fetch appointment data for the given patient id when form is submitted.
    Function returns the appointment location and date for the given patient id as json parameter
'''
@app.route('/get_appointment_history', methods=['POST'])
def get_appointment_history():
    status=""
    patient_id = int(request.form['patient_id'])

    #create database connection
    conn = get_db_connection()
    cursor = conn.cursor()

    # check if patient id is registered 
    cursor.execute('SELECT patientname FROM patientdetails where patientid=%s',(patient_id,))
    check_patient_registered = cursor.fetchone()
    if check_patient_registered is None:
        status="failure"
        return jsonify({'patient_id': patient_id,'status':status})
    else:
        cursor.execute('SELECT location,AppointmentDate FROM appointment where patientid=%s',(patient_id,))
        treatment_details= cursor.fetchall()
        if treatment_details:
            status="success"
        else:
           status="No appointment history"
           return jsonify({'patient_id': patient_id,'status':status})  
    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({'treatment_details' : treatment_details,'status': status})        

#decorators to define route based on the URL  

@app.route('/')
def welcome():
    return render_template("home.html")

@app.route('/home.html')
def home():
    return render_template("home.html")

@app.route('/registration.html')
def registration():
    return render_template("registration.html")

@app.route('/appointment_booking.html')
def appointment_booking():
    return render_template("appointment_booking.html")

@app.route('/appointment_history.html')
def appointment_history():
    return render_template('appointment_history.html')



if __name__=='__main__':
    app.run(debug=True)
