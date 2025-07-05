import axios from "axios";
import React, { useContext, useState, useEffect } from "react";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";
import { Context } from "../../main";

axios.defaults.withCredentials = true;

const Application = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [coverLetter, setCoverLetter] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [resume, setResume] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { isAuthorized, user } = useContext(Context);
  const navigateTo = useNavigate();
  const { id } = useParams();

  // Redirect unauthorized users
  useEffect(() => {
    if (!isAuthorized || (user && user.role === "Employer")) {
      navigateTo("/");
    }
  }, [isAuthorized, user, navigateTo]);

  // Function to handle file input changes
  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    
    // Validate file size (e.g., max 5MB)
    if (selectedFile && selectedFile.size > 5 * 1024 * 1024) {
      toast.error("File size should be less than 5MB");
      return;
    }
    
    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (selectedFile && !allowedTypes.includes(selectedFile.type)) {
      toast.error("Please upload only PDF, JPG, or PNG files");
      return;
    }
    
    setResume(selectedFile);
  };

  const handleApplication = async (e) => {
    e.preventDefault();
    
    // Basic validation

    
    if (!resume) {
      toast.error("Please upload your resume");
      return;
    }
    
    if (!id) {
      toast.error("Job ID is missing");
      return;
    }

    setIsSubmitting(true);
    
    const formData = new FormData();
    formData.append("name", name.trim());
    formData.append("email", email.trim());
    formData.append("phone", phone.trim());
    formData.append("address", address.trim());
    formData.append("coverLetter", coverLetter.trim());
    formData.append("resume", resume);
    formData.append("jobId", id);

    // Debug: Log what we're sending
    console.log("Submitting application with data:", {
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      address: address.trim(),
      coverLetter: coverLetter.trim().substring(0, 100) + "...", // First 100 chars
      resumeName: resume?.name,
      resumeSize: resume?.size,
      resumeType: resume?.type,
      jobId: id
    });

    try {
      const { data } = await axios.post(
        "http://localhost:4000/api/v1/application/post",
        formData,
        {
          withCredentials: true,
          headers: {
            "Content-Type": "multipart/form-data",
          },
          timeout: 30000, // 30 seconds timeout
        }
      );

      // Reset form
      setName("");
      setEmail("");
      setCoverLetter("");
      setPhone("");
      setAddress("");
      setResume(null);
      
      // Reset file input
      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) fileInput.value = '';
      
      toast.success(data.message || "Application submitted successfully!");
      navigateTo("/job/getall");
      
    } catch (error) {
      console.error("Application submission error:", error);
      console.error("Error response:", error.response);
      console.error("Error response data:", error.response?.data);
      
      if (error.response) {
        // Log the full error response for debugging
        console.error("Full error response:", {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
          headers: error.response.headers
        });
        
        const errorMessage = error.response.data?.message || 
                           error.response.data?.error || 
                           error.response.data || 
                           `Server error: ${error.response.status}`;
        toast.error(typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage));
      } else if (error.request) {
        // Request was made but no response received
        console.error("No response received:", error.request);
        toast.error("Network error. Please check your connection and try again.");
      } else {
        // Something else happened
        console.error("Request setup error:", error.message);
        toast.error("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Don't render the form if user is not authorized
  if (!isAuthorized || (user && user.role === "Employer")) {
    return null;
  }

  return (
    <section className="application">
      <div className="container">
        <h3>Application Form</h3>
        <form onSubmit={handleApplication}>
          <input
            type="text"
            placeholder="Your Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            disabled={isSubmitting}
          />
          <input
            type="email"
            placeholder="Your Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isSubmitting}
          />
          <input
            type="tel"
            placeholder="Your Phone Number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            disabled={isSubmitting}
          />
          <input
            type="text"
            placeholder="Your Address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            required
            disabled={isSubmitting}
          />
          <textarea
            placeholder="Cover Letter..."
            value={coverLetter}
            onChange={(e) => setCoverLetter(e.target.value)}
            required
            disabled={isSubmitting}
          />
          <div>
            <label
              style={{
                textAlign: "start",
                display: "block",
                fontSize: "20px",
              }}
            >
              Select Resume *
            </label>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileChange}
              style={{ width: "100%" }}
              required
              disabled={isSubmitting}
            />
          </div>
          <button 
            type="submit" 
            disabled={isSubmitting}
            style={{
              opacity: isSubmitting ? 0.6 : 1,
              cursor: isSubmitting ? 'not-allowed' : 'pointer'
            }}
          >
            {isSubmitting ? "Submitting..." : "Send Application"}
          </button>
        </form>
      </div>
    </section>
  );
};

export default Application;