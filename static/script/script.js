document.addEventListener('DOMContentLoaded', function() {
    // Form IDs
    const patientForm = document.getElementById('patientForm');
    const appointmentForm = document.getElementById('appointmentForm');
    const treatmentForm = document.getElementById('treatmentForm');
    const locationSelect = document.getElementById('location');
    const datePicker = document.getElementById('app_date');
    const modal = document.getElementById('modal');
    const closeBtn = document.getElementById('close-btn');
    const registerLink = document.getElementById('register_link');

    // // Check if elements are found
    // console.log('patientForm:', patientForm);
    // console.log('appointmentForm:', appointmentForm);
    // console.log('treatmentForm:', treatmentForm);
    // console.log('locationSelect:', locationSelect);
    // console.log('datePicker:', datePicker);
    // console.log('modal:', modal);

    // if (!patientForm || !appointmentForm || !treatmentForm || !locationSelect || !datePicker || !modal || !closeBtn) {
    //     console.error('One or more elements not found.');
    //     return;
    // }

    // Patient Registration Form
    if (patientForm) {
    patientForm.addEventListener('submit', async function(event) {
        event.preventDefault();
        
        const formData = new FormData(this);
        const response = await fetch('/add', {
            method: 'POST',
            body: formData
        });
        const result = await response.json();
        if(result.status === "success") {
            openModal_success_patient_page(result);
        } else {
            openModal_failure_patient_page(result);
        }
    });
}
    // Appointment Form
    if (appointmentForm) {
    appointmentForm.addEventListener('submit', async function(event) {
        event.preventDefault();
        
        const formData = new FormData(this);
        const response = await fetch('/book_appointment', {
            method: 'POST',
            body: formData
        });
        const result = await response.json();
        if(result.status === "success") {
            openModal_success_appointment(result);
        } else if(result.status === "failure") {
            openModal_failure_appointment(result);
        } else {
            openModal_appointment_exists(result);
        }
    });
    }
    // Treatment Details Form
    if (treatmentForm) {
    treatmentForm.addEventListener('submit', async function(event) {
        event.preventDefault();
        
        const formData = new FormData(this);
        const response = await fetch('/get_appointment_history', {
            method: 'POST',
            body: formData
        });
        const result = await response.json();
        if(result.status === "success") {
            display_treatment_table(result);
        } 
        else if(result.status === "No appointment history") {
            openModal_no_appointment_history(result);
        }
        else{
            openModal_failure_treatment_page(result);
        }
    });
    }
    if(locationSelect){
    // Date Picker Initialization
    const locationDates = {
        'Anna Nagar-Chennai': ['2024-06-10', '2024-06-20', '2024-06-30'],
        'Pallavaram-Chennai': ['2024-06-15', '2024-06-25'],
        'Vellore': ['2024-06-05', '2024-06-10', '2024-06-15'],
        'Katpadi': ['2024-06-01', '2024-06-11', '2024-06-21']
    };

    function initializeDatePicker(allowedDates) {
        if (allowedDates) {
        flatpickr("#app_date", {
            enable: allowedDates.map(date => new Date(date)),
            dateFormat: "Y-m-d"
        });
    }
    }
    
    locationSelect.addEventListener('change', function() {
        datePicker.value = '';
        const selectedLocation = locationSelect.value;
        const allowedDates = locationDates[selectedLocation] || [];
        initializeDatePicker(allowedDates);
    });

    initializeDatePicker(locationDates[locationSelect.value]);
}

    // Modal Close Button
    if(closeBtn){
    closeBtn.onclick = function() {
        modal.style.display = "none";
        }
    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    }
    }
    // Modal Functions
    function openModal_success_patient_page(data) {
        document.getElementById('status').innerText = "Patient registered successfully!";
        document.getElementById('patient-id').innerText = 'Patient ID: ' + data.patient_id;
        modal.style.display = "block";
    }

    function openModal_failure_patient_page(data) {
        document.getElementById('status').innerText = "Patient already exists";
        document.getElementById('patient-id').innerText = 'Patient ID: ' + data.patient_id;
        modal.style.display = "block";
    }

    function openModal_success_appointment(data) {
        document.getElementById('status').innerText = "Appointment booked successfully!";
        document.getElementById('appointment_time').innerText = 'Appointment time: ' + data.appointment_time;
        modal.style.display = "block";
    }

    function openModal_failure_appointment(data) {
        document.getElementById('status').innerText = "Patient ID: "+ data.patient_id +" does not exist";
        document.getElementById('appointment_time').innerText = 'Please enter the correct Patient ID';
        modal.style.display = "block";
        registerLink.style.display = "block"
    }

    function openModal_appointment_exists(data) {
        document.getElementById('status').innerText = "Patient ID: "+ data.patient_id ;
        document.getElementById('appointment_time').innerText = 'Has already booked an appointment for the selected date';
        modal.style.display = "block";
    }
    //function to convert date to 'dd-mm-yyyy' format
    function formatDate(dateString) {
        const date = new Date(dateString);
        // Extract the day, month, and year from the Date object
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0'); 
        const year = date.getFullYear(); // Get full year
        return `${day}-${month}-${year}`;
    }
    
    function display_treatment_table(data) {
        const treatmentDetails = data.treatment_details;
        const table = document.getElementById('display_table');
    
        while (table.rows.length > 1) {
            table.deleteRow(1);
        }
    
        treatmentDetails.forEach(detail => {
            const row = table.insertRow();
            const cell1 = row.insertCell(0);
            const cell2 = row.insertCell(1);
            cell1.textContent = detail[0];
            const appointmentDate = formatDate(detail[1]);
            cell2.textContent = appointmentDate;
        });
        table.style.display = 'table';
    }
    function openModal_failure_treatment_page(data) {
        document.getElementById('status').innerText = 'Patient ID: ' + data.patient_id + ' does not exist';
        document.getElementById('treatment_details').innerText = "Please enter the correct Patient ID";
        modal.style.display = "block";
    }

    function openModal_no_appointment_history(data) {
        document.getElementById('status').innerText = 'Patient ID: ' + data.patient_id;
        document.getElementById('treatment_details').innerText = "Has no appointment history";
        modal.style.display = "block";
    }
});
