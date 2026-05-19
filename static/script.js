document.addEventListener("DOMContentLoaded", () => {
  const alertArea = document.getElementById("alertArea");
  const subjectSelect = document.getElementById("subject");
  const subjectStatus = document.getElementById("subjectStatus");
  const subjectDisplay = document.getElementById("subjectDisplay");
  const uploadArea = document.getElementById("uploadArea");
  const uploadCard = document.getElementById("uploadCard");
  const fileInput = document.getElementById("pdfUpload");
  const uploadBtn = document.getElementById("uploadBtn");
  const fileName = document.getElementById("uploadFileName");
  const uploadStatus = document.getElementById("uploadStatus");
  const uploadMessage = document.getElementById("uploadMessage");
  const uploadSpinner = document.getElementById("uploadSpinner");
  const uploadProgressBar = document.getElementById("uploadProgressBar");
  const generateBtn = document.getElementById("generateQuizBtn");
  const difficultySelect = document.getElementById("difficulty");
  const quizSpinner = document.getElementById("quizSpinner");
  const quizStatus = document.getElementById("quizStatus");
  const quizStatusText = document.getElementById("quizStatusText");
  const quizSessionCard = document.getElementById("quizSessionCard");
  const micBtn = document.getElementById("micBtn");
  const startRecording = document.getElementById("startRecording");
  const stopRecording = document.getElementById("stopRecording");
  const recordingStatus = document.getElementById("recordingStatus");
  const recordingTimer = document.getElementById("recordingTimer");
  const waveform = document.getElementById("waveform");
  const transcript = document.getElementById("transcript");
  const feedback = document.getElementById("feedback");
  const evaluationCard = document.getElementById("evaluationCard");
  const evaluationText = document.getElementById("evaluationText");
  const correctnessBadge = document.getElementById("correctnessBadge");
  const aiExplanation = document.getElementById("aiExplanation");
  const aiSuggestion = document.getElementById("aiSuggestion");
  const aiConfidence = document.getElementById("aiConfidence");
  const learningRecommendation = document.getElementById("learningRecommendation");
  const answerOptions = document.getElementById("answerOptions");
  const answerInput = document.getElementById("answerInput");
  const submitAnswer = document.getElementById("submitAnswer");
  const scorePill = document.getElementById("scorePill");
  const scoreDisplay = document.getElementById("scoreDisplay");
  const nextQuestion = document.getElementById("nextQuestion");
  const questionHint = document.getElementById("questionHint");
  const currentQuestion = document.getElementById("currentQuestion");
  const timerDisplay = document.getElementById("timerDisplay");
  const totalQuestions = document.getElementById("totalQuestions");
  const correctAnswers = document.getElementById("correctAnswers");
  const quizProgress = document.getElementById("quizProgress");
  const quizProgressBar = document.getElementById("quizProgressBar");
  const quizList = document.getElementById("quizContainer");
  const quizHistory = document.getElementById("quizHistory");
  const subjectList = document.getElementById("subjectList");
  const totalQuizzes = document.getElementById("totalQuizzes");
  const averageScore = document.getElementById("averageScore");
  const strongestSubject = document.getElementById("strongestSubject");
  const weakestSubject = document.getElementById("weakestSubject");
  const speechAccuracyStat = document.getElementById("speechAccuracyStat");
  const latestScore = document.getElementById("latestScore");
  const latestSubject = document.getElementById("latestSubject");
  const avgResponse = document.getElementById("avgResponse");
  const speechAccuracy = document.getElementById("speechAccuracy");
  const performanceTrend = document.getElementById("performanceTrend");
  const exportJson = document.getElementById("exportJson");
  const exportPdf = document.getElementById("exportPdf");
  const recommendations = document.getElementById("recommendations");
  const completionCard = document.getElementById("completionCard");
  const completionSummary = document.getElementById("completionSummary");
  const restartQuiz = document.getElementById("restartQuiz");
  const themeToggle = document.getElementById("themeToggle");
  const customSubjectInput = document.getElementById("customSubjectInput");
  const addSubjectBtn = document.getElementById("addSubjectBtn");
  const scoreTrendCanvas = document.getElementById("scoreTrendChart");
  const completionCanvas = document.getElementById("completionChart");
  const topicCanvas = document.getElementById("topicChart");
  const aiHistoryCanvas = document.getElementById("aiHistoryChart");

  let currentIndex = 1;
  let correctCount = 0;
  let quizItems = [
    { question: "What does CPU stand for?", answer: "Central Processing Unit" }
  ];
  let answeredIndexes = new Set();
  const sessionId = `session_${Date.now()}`;
  let mediaRecorder = null;
  let audioChunks = [];
  let timerInterval = null;
  let timeLeft = 30;
  let questionStartTime = null;
  let responseTimes = [];
  let quizStartTime = null;
  let speechSuccessCount = 0;
  let speechAttemptCount = 0;
  let recordingInterval = null;
  let recordingStart = null;
  let uploadProgressInterval = null;
  let quizResultsCache = [];
  let analyticsCache = null;
  let scoreTrendChart = null;
  let completionChart = null;
  let topicChart = null;
  let aiHistoryChart = null;

  initTheme();
  initCharts();

  // Subject selection handling
  subjectSelect.addEventListener("change", (event) => {
    const subject = event.target.value;
    subjectStatus.textContent = `Subject: ${subject}`;
    subjectDisplay.textContent = subject;
  });

  if (addSubjectBtn) {
    addSubjectBtn.addEventListener("click", () => {
      const value = customSubjectInput ? customSubjectInput.value.trim() : "";
      if (!value) {
        showAlert("error", "Enter a subject name first.");
        return;
      }
      const option = document.createElement("option");
      option.value = value;
      option.textContent = value;
      subjectSelect.appendChild(option);
      subjectSelect.value = value;
      subjectStatus.textContent = `Subject: ${value}`;
      subjectDisplay.textContent = value;
      customSubjectInput.value = "";
      showAlert("success", "Subject added locally.");
    });
  }

  uploadArea.addEventListener("click", () => fileInput.click());
  uploadBtn.addEventListener("click", (event) => {
    event.preventDefault();
    fileInput.click();
  });
  fileInput.addEventListener("change", updateFilePreview);

  uploadArea.addEventListener("dragover", (event) => {
    event.preventDefault();
    uploadArea.classList.add("dragover");
  });

  uploadArea.addEventListener("dragleave", () => {
    uploadArea.classList.remove("dragover");
  });

  uploadArea.addEventListener("drop", (event) => {
    event.preventDefault();
    uploadArea.classList.remove("dragover");
    const file = event.dataTransfer.files[0];
    if (!file) {
      return;
    }
    const dt = new DataTransfer();
    dt.items.add(file);
    fileInput.files = dt.files;
    updateFilePreview();
  });

  function showAlert(type, message) {
    if (!alertArea) {
      return;
    }
    const alert = document.createElement("div");
    alert.className = `alert-card ${type}`;
    alert.textContent = message;
    alertArea.appendChild(alert);
    setTimeout(() => {
      alert.remove();
    }, 4000);
  }

  function setStatus(el, message, statusClass) {
    el.textContent = message;
    el.classList.remove("status-success", "status-error");
    if (statusClass) {
      el.classList.add(statusClass);
    }
  }

  function updateFilePreview() {
    const file = fileInput.files[0];
    if (!file) {
      fileName.textContent = "No file selected";
      setStatus(uploadStatus, "No file uploaded");
      uploadMessage.textContent = "Waiting for file...";
      return;
    }
    fileName.textContent = file.name;
    setStatus(uploadStatus, "Ready to generate");
    uploadMessage.textContent = "Ready to generate quiz";
  }

  generateBtn.addEventListener("click", async () => {
    const file = fileInput.files[0];
    if (!file) {
      showAlert("error", "No PDF selected. Generating a subject-only quiz.");
    }

    console.log("Generating quiz...");
    console.log("Selected file:", file || "None");
    console.log("Sending upload request...");

    generateBtn.disabled = true;
    setCardLoading(quizSessionCard, true);
    setCardLoading(uploadCard, true);
    quizSpinner.classList.remove("d-none");
    quizStatus.textContent = "Generating...";
    quizStatusText.textContent = "Processing your PDF";

    uploadSpinner.classList.remove("d-none");
    setStatus(uploadStatus, "Uploading...", "status-success");
    uploadMessage.textContent = "Uploading PDF...";
    startUploadProgress();

    const formData = new FormData();
    if (file) {
      formData.append("pdf", file);
    }
    formData.append("subject", subjectSelect.value);
    formData.append("difficulty", difficultySelect ? difficultySelect.value : "Medium");

    try {
      const response = await fetch("/generate-quiz", {
        method: "POST",
        body: formData,
        cache: "no-cache"
      });

      const data = await response.json();
      console.log("Upload response received", data);

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Quiz generation failed.");
      }

      quizItems = data.questions || [];
      currentIndex = 1;
      correctCount = 0;
      responseTimes = [];
      quizStartTime = Date.now();
      renderQuizList();
      updateQuestionDisplay();
      renderAnswerInput();
      updateScore();
      startTimer();
      quizStatus.textContent = "Quiz ready";
      quizStatusText.textContent = "Questions loaded successfully";
      setStatus(uploadStatus, "Upload complete", "status-success");
      uploadMessage.textContent = "Quiz generated successfully";
      showAlert("success", data.message || "Quiz generated successfully");
      await refreshDashboard();
    } catch (error) {
      quizStatus.textContent = "Generation failed";
      quizStatusText.textContent = "Try again with a different PDF.";
      setStatus(uploadStatus, "Upload failed", "status-error");
      uploadMessage.textContent = error.message || "Upload failed";
      showAlert("error", error.message || "Quiz generation failed");
    } finally {
      generateBtn.disabled = false;
      setCardLoading(quizSessionCard, false);
      setCardLoading(uploadCard, false);
      quizSpinner.classList.add("d-none");
      uploadSpinner.classList.add("d-none");
      finishUploadProgress();
    }
  });

  // Upload is now handled directly by Generate Quiz
  async function startVoiceRecording() {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        showAlert("error", "Your browser does not support audio recording.");
        return;
      }
      if (typeof MediaRecorder === "undefined") {
        showAlert("error", "MediaRecorder is not supported in this browser.");
        return;
      }
      console.log("[voice] recording started");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunks = [];
      mediaRecorder = new MediaRecorder(stream);

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
        if (!audioBlob.size) {
          recordingStatus.textContent = "Recording: Failed";
          showAlert("error", "Audio processing failed. Try again.");
          return;
        }
        console.log("[voice] recording stopped");
        await sendAudioForRecognition(audioBlob);
      };

      mediaRecorder.start();
      recordingStatus.textContent = "Recording: Listening...";
      setRecordingTimer(true);
      if (waveform) {
        waveform.classList.add("is-active");
      }
      micBtn.classList.add("pulse");
      startRecording.disabled = true;
      stopRecording.disabled = false;
      transcript.textContent = "Listening...";
      feedback.textContent = "Awaiting your answer.";
    } catch (error) {
      console.error("[voice] recording error", error);
      showAlert("error", "Microphone access denied or unavailable.");
    }
  }

  function stopVoiceRecording() {
    if (!mediaRecorder) {
      return;
    }
    mediaRecorder.stop();
    recordingStatus.textContent = "Recording: Processing...";
    setRecordingTimer(false);
    if (waveform) {
      waveform.classList.remove("is-active");
    }
    micBtn.classList.remove("pulse");
    startRecording.disabled = false;
    stopRecording.disabled = true;
  }

  async function sendAudioForRecognition(audioBlob) {
    const formData = new FormData();
    formData.append("audio", audioBlob, "answer.webm");
    speechAttemptCount += 1;

    try {
      console.log("[voice] upload started");
      const response = await fetch("/recognize-answer", {
        method: "POST",
        body: formData
      });
      const data = await response.json();
      console.log("[voice] server response", data);
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Speech recognition failed.");
      }
      transcript.textContent = data.text;
      recordingStatus.textContent = "Recording: Complete";
      showAlert("success", "Recognition successful");
      if (answerInput) {
        answerInput.value = data.text;
      }
      speechSuccessCount += 1;
      await evaluateAnswer(data.text);
    } catch (error) {
      console.error("[voice] recognition error", error);
      recordingStatus.textContent = "Recording: Failed";
      feedback.textContent = "Speech not recognized.";
      showAlert("error", error.message);
    }
  }

  async function evaluateAnswer(userAnswer) {
    const currentItem = quizItems[currentIndex - 1];
    if (!currentItem) {
      showAlert("error", "No question available for evaluation.");
      return;
    }

    try {
      const response = await fetch("/evaluate-answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_answer: userAnswer,
          correct_answer: currentItem.answer,
          question: currentItem.question,
          subject: subjectSelect.value,
          session_id: sessionId
        })
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Evaluation failed.");
      }

      evaluationCard.classList.remove("success", "error");
      if (correctnessBadge) {
        correctnessBadge.classList.remove("success", "error");
      }
      if (data.is_correct) {
        evaluationCard.classList.add("success");
        if (correctnessBadge) {
          correctnessBadge.textContent = "Correct";
          correctnessBadge.classList.add("success");
        }
        evaluationText.textContent = "Correct answer!";
      } else {
        evaluationCard.classList.add("error");
        if (correctnessBadge) {
          correctnessBadge.textContent = "Needs Work";
          correctnessBadge.classList.add("error");
        }
        evaluationText.textContent = `Not quite. Correct answer: ${currentItem.answer}`;
      }

      if (aiExplanation) {
        aiExplanation.textContent = data.explanation || "Explanation unavailable.";
      }
      if (aiSuggestion) {
        aiSuggestion.textContent = data.suggestion || "Suggestion unavailable.";
      }
      if (aiConfidence) {
        const confidenceValue = Math.round((data.confidence || 0) * 100);
        aiConfidence.textContent = `${confidenceValue}%`;
      }
      if (learningRecommendation) {
        learningRecommendation.textContent = data.is_correct
          ? "Great work. Try increasing the difficulty next session."
          : "Review the PDF summary and retry this question.";
      }

      if (!answeredIndexes.has(currentIndex)) {
        answeredIndexes.add(currentIndex);
        if (data.is_correct) {
          correctCount += 1;
        }
      }

      feedback.textContent = data.is_correct ? "Great job!" : "Review the correct answer above.";
      recordResponseTime();
      updateScore();
    } catch (error) {
      showAlert("error", error.message);
    }
  }

  if (submitAnswer) {
    submitAnswer.addEventListener("click", () => {
      const value = answerInput ? answerInput.value.trim() : "";
      if (!value) {
        showAlert("error", "Enter or select an answer first.");
        return;
      }
      evaluateAnswer(value);
    });
  }

  // Start/Stop recording UI behavior
  startRecording.addEventListener("click", startVoiceRecording);
  stopRecording.addEventListener("click", stopVoiceRecording);

  // Next question placeholder logic
  nextQuestion.addEventListener("click", () => {
    advanceQuestion(false);
  });

  restartQuiz.addEventListener("click", () => {
    answeredIndexes = new Set();
    correctCount = 0;
    currentIndex = 1;
    completionCard.classList.add("is-hidden");
    updateQuestionDisplay();
    renderAnswerInput();
    updateScore();
  });

  function updateQuestionDisplay() {
    const item = quizItems[currentIndex - 1];
    currentQuestion.textContent = item ? item.question : "Question unavailable";
    questionHint.textContent = `Question ${currentIndex} of ${quizItems.length || 1}`;
  }

  function renderAnswerInput() {
    if (!answerOptions || !answerInput) {
      return;
    }
    answerOptions.innerHTML = "";
    answerInput.value = "";
    const item = quizItems[currentIndex - 1];
    if (!item) {
      return;
    }
    const type = item.type || "short_answer";
    if (type === "multiple_choice" && Array.isArray(item.options)) {
      item.options.forEach((option) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "option-btn";
        btn.textContent = option;
        btn.addEventListener("click", () => {
          answerInput.value = option;
          answerOptions.querySelectorAll(".option-btn").forEach((el) => {
            el.classList.remove("selected");
          });
          btn.classList.add("selected");
        });
        answerOptions.appendChild(btn);
      });
    } else if (type === "true_false") {
      ["True", "False"].forEach((option) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "option-btn";
        btn.textContent = option;
        btn.addEventListener("click", () => {
          answerInput.value = option;
          answerOptions.querySelectorAll(".option-btn").forEach((el) => {
            el.classList.remove("selected");
          });
          btn.classList.add("selected");
        });
        answerOptions.appendChild(btn);
      });
    }
  }

  function updateScore() {
    const totalCount = quizItems.length || 1;
    const scoreText = `Score: ${correctCount}/${totalCount}`;
    scorePill.textContent = scoreText;
    scoreDisplay.textContent = scoreText;
    correctAnswers.textContent = correctCount;
    totalQuestions.textContent = totalCount;
    const progress = Math.round((currentIndex / totalCount) * 100);
    quizProgress.textContent = `${progress}%`;
    quizProgressBar.style.width = `${progress}%`;
    bumpScore();
  }

  function showCompletion() {
    const totalCount = quizItems.length || 1;
    const percent = Math.round((correctCount / totalCount) * 100);
    completionSummary.textContent = `You scored ${correctCount}/${totalCount} (${percent}%) in ${subjectSelect.value}.`;
    completionCard.classList.remove("is-hidden");
    clearInterval(timerInterval);
    const avgTime = getAverageResponseTime();
    const accuracy = getSpeechAccuracy();
    const duration = quizStartTime ? Math.round((Date.now() - quizStartTime) / 1000) : null;
    saveQuizResults(correctCount, totalCount, percent, subjectSelect.value, avgTime, accuracy, duration);
    updateInsights(avgTime, accuracy);
  }

  function renderQuizList() {
    quizList.innerHTML = "";
    if (!quizItems.length) {
      quizList.innerHTML = "<div class=\"quiz-item\">No questions generated yet.</div>";
      return;
    }
    quizItems.forEach((item) => {
      const card = document.createElement("div");
      card.className = "quiz-item";
      card.innerHTML = `
        <div class="quiz-item-question">${item.question}</div>
        <div class="quiz-item-answer">${item.answer}</div>
      `;
      quizList.appendChild(card);
    });
  }

  renderQuizList();
  updateQuestionDisplay();
  updateScore();
  refreshDashboard();

  if (exportJson) {
    exportJson.addEventListener("click", () => {
      const report = {
        subject: subjectSelect.value,
        difficulty: difficultySelect ? difficultySelect.value : "Medium",
        score: correctCount,
        total: quizItems.length,
        questions: quizItems,
        response_times: responseTimes
      };
      const blob = new Blob([JSON.stringify(report, null, 2)], {
        type: "application/json"
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "quiz-report.json";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    });
  }

  if (exportPdf) {
    exportPdf.addEventListener("click", () => {
      showAlert("error", "PDF export is coming soon.");
    });
  }

  async function refreshDashboard() {
    await Promise.all([loadSubjects(), loadQuizHistory(), loadQuizResults(), loadAnalytics()]);
  }

  async function loadSubjects() {
    if (!subjectList) {
      return;
    }
    try {
      const response = await fetch("/subjects");
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to load subjects");
      }
      subjectList.innerHTML = data.subjects.length
        ? data.subjects
            .map((item) => `<div class="history-card"><strong>${item.name}</strong><span>Active</span></div>`)
            .join("")
        : "No subjects saved yet.";
    } catch (error) {
      subjectList.innerHTML = "Failed to load subjects.";
    }
  }

  async function loadQuizHistory() {
    if (!quizHistory) {
      return;
    }
    try {
      const response = await fetch("/quiz-history");
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to load history");
      }
      quizHistory.innerHTML = data.history.length
        ? data.history
            .map(
              (item) =>
                `<div class="history-card"><strong>${item.subject}</strong><span>${item.pdf_filename || "PDF"}</span></div>`
            )
            .join("")
        : "No quiz history yet.";
    } catch (error) {
      quizHistory.innerHTML = "Failed to load quiz history.";
    }
  }

  async function loadQuizResults() {
    try {
      const response = await fetch("/quiz-results");
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to load results");
      }
      const results = data.results || [];
      quizResultsCache = results;
      if (results.length && latestScore && latestSubject) {
        const latest = results[0];
        latestScore.textContent = `${latest.score}/${latest.total}`;
        latestSubject.textContent = latest.subject || "-";
      }
      if (results.length) {
        const latest = results[0];
        if (avgResponse) {
          avgResponse.textContent = latest.avg_response_time
            ? `${latest.avg_response_time}s`
            : "-";
        }
        if (speechAccuracy) {
          speechAccuracy.textContent = latest.speech_accuracy
            ? `${Math.round(latest.speech_accuracy * 100)}%`
            : "-";
        }
        if (performanceTrend) {
          const scoreValue = latest.percentage || 0;
          performanceTrend.textContent = scoreValue > 70 ? "Improving" : "Needs focus";
        }
      }
      updateCharts();
    } catch (error) {
      if (latestScore) {
        latestScore.textContent = "-";
      }
    }
  }

  async function loadAnalytics() {
    try {
      const response = await fetch("/analytics");
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to load analytics");
      }

      if (totalQuizzes) {
        totalQuizzes.textContent = data.total_quizzes ?? 0;
      }
      if (averageScore) {
        averageScore.textContent = `${data.average_score ?? 0}%`;
      }
      if (strongestSubject) {
        strongestSubject.textContent = data.strongest_subject || "-";
      }
      if (weakestSubject) {
        weakestSubject.textContent = data.weakest_subject || "-";
      }
      if (speechAccuracyStat) {
        const value = data.speech_accuracy ? Math.round(data.speech_accuracy * 100) : 0;
        speechAccuracyStat.textContent = `${value}%`;
      }
      analyticsCache = data;
      updateCharts();
    } catch (error) {
      if (averageScore) {
        averageScore.textContent = "-";
      }
    }
  }

  async function saveQuizResults(score, total, percentage, subject, avgTime, accuracy, duration) {
    try {
      await fetch("/quiz-results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          score,
          total,
          percentage,
          subject,
          avg_response_time: avgTime,
          speech_accuracy: accuracy,
          difficulty: difficultySelect ? difficultySelect.value : "Medium",
          duration
        })
      });
    } catch (error) {
      showAlert("error", "Failed to save quiz results.");
    }
  }

  function startTimer() {
    clearInterval(timerInterval);
    timeLeft = 30;
    questionStartTime = Date.now();
    if (timerDisplay) {
      timerDisplay.textContent = `Time left: ${timeLeft}s`;
    }
    timerInterval = setInterval(() => {
      timeLeft -= 1;
      if (timerDisplay) {
        timerDisplay.textContent = `Time left: ${timeLeft}s`;
      }
      if (timeLeft <= 0) {
        clearInterval(timerInterval);
        advanceQuestion(true);
      }
    }, 1000);
  }

  function recordResponseTime() {
    if (!questionStartTime) {
      return;
    }
    const elapsed = Math.round((Date.now() - questionStartTime) / 1000);
    responseTimes.push(elapsed);
  }

  function getAverageResponseTime() {
    if (!responseTimes.length) {
      return null;
    }
    const total = responseTimes.reduce((sum, value) => sum + value, 0);
    return Math.round(total / responseTimes.length);
  }

  function getSpeechAccuracy() {
    const attempts = speechAttemptCount + speechSuccessCount;
    if (!attempts) {
      return null;
    }
    return speechSuccessCount / attempts;
  }

  function updateInsights(avgTime, accuracy) {
    if (avgResponse && avgTime) {
      avgResponse.textContent = `${avgTime}s`;
    }
    if (speechAccuracy && accuracy) {
      speechAccuracy.textContent = `${Math.round(accuracy * 100)}%`;
    }
    if (performanceTrend) {
      performanceTrend.textContent = correctCount >= Math.ceil(quizItems.length * 0.7)
        ? "Strong performance"
        : "Needs practice";
    }
    if (recommendations) {
      const tip = correctCount >= Math.ceil(quizItems.length * 0.7)
        ? "Try a harder difficulty next time."
        : "Review the PDF highlights and retry.";
      recommendations.innerHTML = `<div class="history-card">${tip}</div>`;
    }
  }

  function advanceQuestion(isAuto) {
    if (!quizItems.length) {
      showAlert("error", "Generate a quiz to view questions.");
      return;
    }
    currentIndex = currentIndex < quizItems.length ? currentIndex + 1 : 1;
    updateQuestionDisplay();
    updateScore();
    transcript.textContent = "Your speech will appear here.";
    feedback.textContent = isAuto ? "Time expired. Moving on." : "Feedback will appear after evaluation.";
    evaluationCard.classList.remove("success", "error");
    evaluationText.textContent = "Awaiting your answer.";
    if (aiExplanation) {
      aiExplanation.textContent = "Explanation will appear here.";
    }
    if (aiSuggestion) {
      aiSuggestion.textContent = "Suggestions will appear here.";
    }
    if (aiConfidence) {
      aiConfidence.textContent = "0%";
    }
    if (correctnessBadge) {
      correctnessBadge.textContent = "Waiting";
      correctnessBadge.classList.remove("success", "error");
    }
    if (learningRecommendation) {
      learningRecommendation.textContent = "Recommendations will appear here.";
    }
    recordingStatus.textContent = "Recording: Idle";
    renderAnswerInput();
    startTimer();

    if (answeredIndexes.size >= quizItems.length) {
      showCompletion();
    }
  }

  // TODO: Firebase integration for storing quiz progress
  // TODO: Flask API calls for voice answer evaluation

  function initTheme() {
    const storedTheme = localStorage.getItem("theme") || "dark";
    document.documentElement.setAttribute("data-theme", storedTheme);
    if (themeToggle) {
      themeToggle.addEventListener("click", () => {
        const current = document.documentElement.getAttribute("data-theme") || "dark";
        const next = current === "dark" ? "light" : "dark";
        document.documentElement.setAttribute("data-theme", next);
        localStorage.setItem("theme", next);
      });
    }
  }

  function setRecordingTimer(isRunning) {
    if (!recordingTimer) {
      return;
    }
    if (!isRunning) {
      if (recordingInterval) {
        clearInterval(recordingInterval);
      }
      recordingTimer.textContent = "00:00";
      recordingStart = null;
      return;
    }
    recordingStart = Date.now();
    recordingTimer.textContent = "00:00";
    recordingInterval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - recordingStart) / 1000);
      const minutes = String(Math.floor(elapsed / 60)).padStart(2, "0");
      const seconds = String(elapsed % 60).padStart(2, "0");
      recordingTimer.textContent = `${minutes}:${seconds}`;
    }, 500);
  }

  function setCardLoading(card, isLoading) {
    if (!card) {
      return;
    }
    card.classList.toggle("is-loading", isLoading);
  }

  function startUploadProgress() {
    if (!uploadProgressBar) {
      return;
    }
    uploadProgressBar.style.width = "10%";
    let progress = 10;
    clearInterval(uploadProgressInterval);
    uploadProgressInterval = setInterval(() => {
      progress = Math.min(progress + Math.random() * 12, 90);
      uploadProgressBar.style.width = `${Math.round(progress)}%`;
    }, 300);
  }

  function finishUploadProgress() {
    if (!uploadProgressBar) {
      return;
    }
    clearInterval(uploadProgressInterval);
    uploadProgressBar.style.width = "100%";
    setTimeout(() => {
      uploadProgressBar.style.width = "0%";
    }, 800);
  }

  function bumpScore() {
    if (scorePill) {
      scorePill.classList.remove("score-bump");
      void scorePill.offsetWidth;
      scorePill.classList.add("score-bump");
    }
    if (scoreDisplay) {
      scoreDisplay.classList.remove("score-bump");
      void scoreDisplay.offsetWidth;
      scoreDisplay.classList.add("score-bump");
    }
  }

  function initCharts() {
    if (!window.Chart) {
      return;
    }
    if (scoreTrendCanvas) {
      scoreTrendChart = new Chart(scoreTrendCanvas, {
        type: "line",
        data: { labels: [], datasets: [{ label: "Score %", data: [], borderColor: "#38bdf8", tension: 0.4 }] },
        options: { responsive: true, plugins: { legend: { display: false } } }
      });
    }
    if (completionCanvas) {
      completionChart = new Chart(completionCanvas, {
        type: "doughnut",
        data: { labels: ["Completed", "Pending"], datasets: [{ data: [0, 0], backgroundColor: ["#22c55e", "#1f2937"] }] },
        options: { plugins: { legend: { position: "bottom" } } }
      });
    }
    if (topicCanvas) {
      topicChart = new Chart(topicCanvas, {
        type: "bar",
        data: { labels: [], datasets: [{ label: "Avg Score", data: [], backgroundColor: "#38bdf8" }] },
        options: { plugins: { legend: { display: false } } }
      });
    }
    if (aiHistoryCanvas) {
      aiHistoryChart = new Chart(aiHistoryCanvas, {
        type: "line",
        data: { labels: [], datasets: [{ label: "AI Confidence", data: [], borderColor: "#f97316", tension: 0.4 }] },
        options: { plugins: { legend: { display: false } } }
      });
    }
  }

  function updateCharts() {
    if (!quizResultsCache.length) {
      return;
    }
    if (scoreTrendChart) {
      const recent = [...quizResultsCache].slice(0, 8).reverse();
      scoreTrendChart.data.labels = recent.map((_, idx) => `Quiz ${idx + 1}`);
      scoreTrendChart.data.datasets[0].data = recent.map((item) => item.percentage || 0);
      scoreTrendChart.update();
    }
    if (completionChart) {
      const completed = quizResultsCache.length;
      const pending = Math.max(10 - completed, 0);
      completionChart.data.datasets[0].data = [completed, pending];
      completionChart.update();
    }
    if (topicChart) {
      const subjectScores = {};
      quizResultsCache.forEach((item) => {
        const subject = item.subject || "Unknown";
        subjectScores[subject] = subjectScores[subject] || [];
        subjectScores[subject].push(item.percentage || 0);
      });
      const subjects = Object.keys(subjectScores);
      const averages = subjects.map((subject) => {
        const scores = subjectScores[subject];
        return Math.round(scores.reduce((sum, value) => sum + value, 0) / scores.length);
      });
      topicChart.data.labels = subjects.slice(0, 4);
      topicChart.data.datasets[0].data = averages.slice(0, 4);
      topicChart.update();
    }
    if (aiHistoryChart) {
      const recent = [...quizResultsCache].slice(0, 8).reverse();
      aiHistoryChart.data.labels = recent.map((_, idx) => `Quiz ${idx + 1}`);
      aiHistoryChart.data.datasets[0].data = recent.map((item) => Math.round((item.percentage || 0) * 0.9));
      aiHistoryChart.update();
    }
  }
});
