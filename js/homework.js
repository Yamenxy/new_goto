/* =========================================================
   HOMEWORK SYSTEM
   Mr. Ahmed Mohie Physics
   ========================================================= */


/* =========================================================
   GOOGLE APPS SCRIPT URLS
   ========================================================= */

// 1. Main Videos 3
// Contains:
// Title | Image | Link
const MAIN_VIDEOS_API =
    "https://script.google.com/macros/s/AKfycbwQNMEz5NCkdhPd4fvK_iWhVGcDBPZY78f7Jbe_0RZB9kRSkNQk2TZmYlw9rB-P8M8T/exec";


// 2. Third Secondary Videos
// Contains:
// video1 | Drive | pCloud | Mega
const LESSON_VIDEOS_API =
    "https://script.google.com/macros/s/AKfycbxzx44D-Lwn_Jt2ScVQJlkNHQ7LBSRw2h7odaqCEsKubdhazczMWtd0JY-03tZVTBw/exec";


// 3. Homework 3 / Attendance
// Contains:
// student code + attendance
const ATTENDANCE_API =
    "https://script.google.com/macros/s/AKfycbxdHXnO8VB4ubw30DHFa88T2vNi98PctOPhjFMTYAYeDGth30EXzOcLgAEnf3ZTOVu7LA/exec";



/* =========================================================
   GLOBAL VARIABLES
   ========================================================= */

let currentStudent = null;

let allHomework = [];

let allLessonVideos = [];

let currentLanguage =
    localStorage.getItem("language") || "ar";



/* =========================================================
   LANGUAGE
   ========================================================= */

function updateLanguage() {

    currentLanguage =
        localStorage.getItem("language") || "ar";


    // Page direction
    document.documentElement.lang =
        currentLanguage;

    document.documentElement.dir =
        currentLanguage === "ar"
            ? "rtl"
            : "ltr";


    // Update text
    document
        .querySelectorAll(
            "[data-en], [data-ar]"
        )
        .forEach(element => {

            const text =
                element.getAttribute(
                    "data-" + currentLanguage
                );


            if (text === null) {
                return;
            }


            // Only replace plain text elements
            if (
                element.children.length === 0
            ) {

                element.textContent = text;

            }

        });


    // Update language button
    const languageButton =
        document.getElementById(
            "languageToggle"
        );


    if (languageButton) {

        const span =
            languageButton.querySelector(
                "span"
            );


        if (span) {

            span.textContent =
                currentLanguage === "ar"
                    ? "English"
                    : "العربية";

        }

    }

}



function toggleLanguage() {

    const current =
        localStorage.getItem("language") || "ar";


    const next =
        current === "ar"
            ? "en"
            : "ar";


    localStorage.setItem(
        "language",
        next
    );


    updateLanguage();

}



/* =========================================================
   PAGE INITIALIZATION
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        updateLanguage();

        autoLoadHomework();

    }
);



/* =========================================================
   GET LOGGED-IN STUDENT
   ========================================================= */

function getLoggedInStudentCode() {

    const loggedInUser =
        localStorage.getItem(
            "loggedInUser"
        );


    if (!loggedInUser) {

        return null;

    }


    /*
     * Your website may store loggedInUser
     * as either:
     *
     * 30000
     *
     * or JSON:
     *
     * {
     *   code: "30000",
     *   ...
     * }
     */


    try {

        const parsed =
            JSON.parse(
                loggedInUser
            );


        if (
            parsed &&
            typeof parsed === "object"
        ) {

            return String(
                parsed.code ||
                parsed.studentCode ||
                parsed.student_id ||
                parsed.id ||
                parsed["الكود"] ||
                ""
            ).trim();

        }

    } catch (error) {

        // Not JSON.
        // Continue below.

    }


    return String(
        loggedInUser
    ).trim();

}



/* =========================================================
   AUTOMATIC HOMEWORK LOADING
   ========================================================= */

async function autoLoadHomework() {

    try {

        updateLanguage();


        const code =
            getLoggedInStudentCode();


        /*
         * If there is no logged-in student,
         * show the manual code box.
         */

        if (!code) {

            showElement(
                "autoLoadCard",
                false
            );


            showElement(
                "codeCheckCard",
                true
            );


            return;

        }


        showElement(
            "autoLoadCard",
            true
        );


        showElement(
            "codeCheckCard",
            false
        );


        setAutoLoadMessage(
            "جاري التحقق من حضورك..."
        );


        await loadHomeworkData(
            code
        );


    } catch (error) {

        console.error(
            "Homework error:",
            error
        );


        showHomeworkError(
            error.message
        );

    }

}



/* =========================================================
   MANUAL CODE CHECK
   ========================================================= */

async function checkHomeworkAccess() {

    const input =
        document.getElementById(
            "hwStudentCode"
        );


    const button =
        document.getElementById(
            "hwCheckBtn"
        );


    if (!input) {

        return;

    }


    const code =
        String(
            input.value || ""
        ).trim();


    if (!code) {

        showAlert(
            "من فضلك أدخل كود الطالب.",
            "error"
        );


        return;

    }


    try {

        if (button) {

            button.disabled = true;

            button.innerHTML =
                `
                <i class="fas fa-spinner fa-spin"></i>
                <span>جاري التحميل...</span>
                `;

        }


        await loadHomeworkData(
            code
        );


    } catch (error) {

        console.error(
            "Manual homework error:",
            error
        );


        showAlert(
            error.message,
            "error"
        );


    } finally {

        if (button) {

            button.disabled = false;

            button.innerHTML =
                `
                <i class="fas fa-search"></i>
                <span data-en="Show My Homework"
                      data-ar="عرض واجباتي">
                    عرض واجباتي
                </span>
                `;


            updateLanguage();

        }

    }

}



/* =========================================================
   MAIN HOMEWORK LOADING
   ========================================================= */

async function loadHomeworkData(
    studentCode
) {

    setAutoLoadMessage(
        "جاري تحميل بيانات الحضور..."
    );


    // ---------------------------------------------
    // 1. Get attendance
    // ---------------------------------------------

    const attendance =
        await fetchAttendance(
            studentCode
        );


    if (
        !attendance ||
        attendance.status !== "success"
    ) {

        throw new Error(
            attendance?.message ||
            "تعذر الحصول على بيانات الحضور."
        );

    }


    currentStudent =
        attendance;


    // ---------------------------------------------
    // 2. Get homework
    // ---------------------------------------------

    setAutoLoadMessage(
        "جاري تحميل الواجبات..."
    );


    const homework =
        await fetchHomework();


    allHomework =
        homework || [];


    // ---------------------------------------------
    // 3. Get lesson videos
    // ---------------------------------------------

    setAutoLoadMessage(
        "جاري تحميل الفيديوهات..."
    );


    const lessonVideos =
        await fetchLessonVideos();


    allLessonVideos =
        lessonVideos || [];


    // ---------------------------------------------
    // 4. Match attendance with homework
    // ---------------------------------------------

    const availableHomework =
        getAvailableHomework(
            allHomework,
            attendance.attendance
        );


    // ---------------------------------------------
    // 5. Show results
    // ---------------------------------------------

    showElement(
        "autoLoadCard",
        false
    );


    showElement(
        "codeCheckCard",
        false
    );


    renderHomework(
        availableHomework
    );


}



/* =========================================================
   FETCH ATTENDANCE
   ========================================================= */

async function fetchAttendance(
    studentCode
) {

    const url =
        ATTENDANCE_API +
        "?action=getStudentData&code=" +
        encodeURIComponent(
            studentCode
        );


    const response =
        await fetch(
            url,
            {
                method: "GET",
                cache: "no-store"
            }
        );


    if (!response.ok) {

        throw new Error(
            "Attendance server returned HTTP " +
            response.status
        );

    }


    const text =
        await response.text();


    let data;


    try {

        data =
            JSON.parse(text);

    } catch (error) {

        console.error(
            "Invalid attendance response:",
            text
        );


        throw new Error(
            "Google Sheets returned an invalid response."
        );

    }


    return data;

}



/* =========================================================
   FETCH HOMEWORK
   ========================================================= */

async function fetchHomework() {

    const response =
        await fetch(
            MAIN_VIDEOS_API +
            "?t=" +
            Date.now(),
            {
                method: "GET",
                cache: "no-store"
            }
        );


    if (!response.ok) {

        throw new Error(
            "Homework server returned HTTP " +
            response.status
        );

    }


    const text =
        await response.text();


    let data;


    try {

        data =
            JSON.parse(text);

    } catch (error) {

        console.error(
            "Invalid homework response:",
            text
        );


        throw new Error(
            "Google Sheets homework response is invalid."
        );

    }


    if (!Array.isArray(data)) {

        return [];

    }


    return data;

}



/* =========================================================
   FETCH LESSON VIDEOS
   ========================================================= */

async function fetchLessonVideos() {

    /*
     * The lesson-video API needs pageName.
     *
     * We request video1, video2, etc.
     *
     * We first determine how many lectures
     * exist from the homework list.
     */


    const numberOfLectures =
        Math.max(
            allHomework.length,
            20
        );


    const videos = [];


    for (
        let i = 1;
        i <= numberOfLectures;
        i++
    ) {

        const pageName =
            "video" + i;


        try {

            const url =
                LESSON_VIDEOS_API +
                "?pageName=" +
                encodeURIComponent(
                    pageName
                ) +
                "&t=" +
                Date.now();


            const response =
                await fetch(
                    url,
                    {
                        method: "GET",
                        cache: "no-store"
                    }
                );


            if (!response.ok) {

                continue;

            }


            const text =
                await response.text();


            let data;


            try {

                data =
                    JSON.parse(text);

            } catch (error) {

                continue;

            }


            if (
                data &&
                !data.error
            ) {

                videos.push({

                    pageName:
                        pageName,

                    drive:
                        cleanUrl(
                            data.drive
                        ),

                    pcloud:
                        cleanUrl(
                            data.pcloud
                        ),

                    mega:
                        cleanUrl(
                            data.mega
                        )

                });

            }

        } catch (error) {

            console.warn(
                "Could not load " +
                pageName,
                error
            );

        }

    }


    return videos;

}



/* =========================================================
   MATCH HOMEWORK TO ATTENDANCE
   ========================================================= */

function getAvailableHomework(
    homework,
    attendance
) {

    if (
        !Array.isArray(homework)
    ) {

        return [];

    }


    if (
        !Array.isArray(attendance)
    ) {

        return [];

    }


    const result = [];


    homework.forEach(
        (
            item,
            homeworkIndex
        ) => {

            /*
             * Homework row:
             *
             * واجب المحاضرة الاولي
             *
             * واجب المحاضرة التانية
             *
             * واجب المحاضرة التالتة
             *
             *
             * We determine lecture number
             * from the position in the sheet.
             */


            const lectureNumber =
                homeworkIndex + 1;


            const attendanceRecord =
                attendance.find(
                    record =>
                        Number(
                            record.value
                        ) ===
                        lectureNumber
                );


            if (
                attendanceRecord &&
                attendanceRecord.present
            ) {

                result.push({

                    ...item,

                    lectureNumber:
                        lectureNumber,

                    attendance:
                        attendanceRecord

                });

            }

        }
    );


    return result;

}



/* =========================================================
   RENDER HOMEWORK
   ========================================================= */

function renderHomework(
    homework
) {

    const section =
        document.getElementById(
            "homeworkList"
        );


    const grid =
        document.getElementById(
            "homeworkGrid"
        );


    if (!section || !grid) {

        return;

    }


    section.style.display =
        "block";


    grid.innerHTML = "";


    // ---------------------------------------------
    // No homework
    // ---------------------------------------------

    if (
        !homework ||
        homework.length === 0
    ) {

        grid.innerHTML =
            `
            <div
                style="
                    width:100%;
                    text-align:center;
                    padding:60px 20px;
                "
            >

                <i
                    class="fas fa-book-open"
                    style="
                        font-size:50px;
                        opacity:.5;
                        margin-bottom:20px;
                    "
                ></i>

                <h3>
                    لا توجد واجبات متاحة حالياً
                </h3>

                <p
                    style="
                        color:var(--text-muted);
                        margin-top:10px;
                    "
                >
                    الواجبات ستظهر تلقائياً
                    بعد حضور المحاضرة.
                </p>

            </div>
            `;


        return;

    }



    // ---------------------------------------------
    // Render cards
    // ---------------------------------------------

    homework.forEach(
        (
            item,
            index
        ) => {

            const card =
                createHomeworkCard(
                    item,
                    index
                );


            grid.appendChild(
                card
            );

        }
    );


    updateLanguage();

}



/* =========================================================
   CREATE HOMEWORK CARD
   ========================================================= */

function createHomeworkCard(
    item,
    index
) {

    const card =
        document.createElement(
            "div"
        );


    card.className =
        "content-card homework-card";


    const title =
        escapeHtml(
            item.title ||
            `واجب المحاضرة ${index + 1}`
        );


    const image =
        cleanUrl(
            item.imgSrc
        ) ||
        "https://i.postimg.cc/Zn32QtQc/27aaa2af-994c-4d8a-8221-c5a3674cbb9b.jpg";


    const link =
        cleanUrl(
            item.link
        );


    card.innerHTML =
        `
        <div
            style="
                overflow:hidden;
                border-radius:12px;
                margin-bottom:18px;
            "
        >

            <img
                src="${escapeAttribute(image)}"
                alt="${escapeAttribute(title)}"
                style="
                    width:100%;
                    display:block;
                    aspect-ratio:16/9;
                    object-fit:cover;
                "
                onerror="
                    this.src='https://i.postimg.cc/Zn32QtQc/27aaa2af-994c-4d8a-8221-c5a3674cbb9b.jpg';
                "
            >

        </div>


        <div
            style="
                display:flex;
                flex-direction:column;
                gap:12px;
            "
        >

            <h3
                style="margin:0;"
            >
                ${title}
            </h3>


            <div
                style="
                    color:var(--text-muted);
                    font-size:.9rem;
                "
            >

                <i class="fas fa-circle-check"></i>

                <span>
                    المحاضرة
                    ${item.lectureNumber}
                </span>

            </div>


            <button
                type="button"
                class="btn btn-primary"
                onclick="openHomeworkVideo(${index})"
            >

                <i class="fas fa-play"></i>

                مشاهدة الفيديو

            </button>


            ${
                link
                    ? `
                    <a
                        href="${escapeAttribute(link)}"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="btn btn-outline"
                    >

                        <i class="fas fa-external-link-alt"></i>

                        فتح صفحة الواجب

                    </a>
                    `
                    : ""
            }

        </div>
        `;


    return card;

}



/* =========================================================
   OPEN HOMEWORK VIDEO
   ========================================================= */

function openHomeworkVideo(
    index
) {

    if (
        !Array.isArray(allHomework) ||
        allHomework.length === 0
    ) {

        return;

    }


    /*
     * allHomework contains the entire sheet.
     *
     * We need to find the actual available
     * homework by attendance again.
     */


    const available =
        getAvailableHomework(
            allHomework,
            currentStudent?.attendance || []
        );


    const homework =
        available[index];


    if (!homework) {

        return;

    }


    const lectureNumber =
        homework.lectureNumber;


    const videoPageName =
        "video" +
        lectureNumber;


    const video =
        allLessonVideos.find(
            item =>
                item.pageName ===
                videoPageName
        );


    showVideoPlayer(
        homework,
        video
    );

}



/* =========================================================
   SHOW VIDEO PLAYER
   ========================================================= */

function showVideoPlayer(
    homework,
    video
) {

    const section =
        document.getElementById(
            "videoPlayerSection"
        );


    const wrapper =
        document.getElementById(
            "videoWrapper"
        );


    const title =
        document.getElementById(
            "videoTitle"
        );


    if (!section || !wrapper) {

        return;

    }


    if (title) {

        title.textContent =
            homework.title ||
            "Homework Video";

    }


    wrapper.innerHTML = "";


    // ---------------------------------------------
    // No video links
    // ---------------------------------------------

    if (
        !video ||
        (
            !video.drive &&
            !video.pcloud &&
            !video.mega
        )
    ) {

        wrapper.innerHTML =
            `
            <div
                style="
                    text-align:center;
                    padding:50px 20px;
                "
            >

                <i
                    class="fas fa-video-slash"
                    style="
                        font-size:50px;
                        margin-bottom:20px;
                        opacity:.5;
                    "
                ></i>

                <h3>
                    الفيديو غير متاح حالياً
                </h3>

                <p
                    style="
                        color:var(--text-muted);
                        margin-top:10px;
                    "
                >
                    سيتم إضافة الفيديو قريباً.
                </p>

            </div>
            `;


        section.style.display =
            "block";


        hideHomeworkList();


        return;

    }


    // ---------------------------------------------
    // Create video options
    // ---------------------------------------------

    const container =
        document.createElement(
            "div"
        );


    container.style.cssText =
        `
        max-width:1000px;
        margin:0 auto;
        `;


    const heading =
        document.createElement(
            "div"
        );


    heading.style.cssText =
        `
        text-align:center;
        margin-bottom:25px;
        `;


    heading.innerHTML =
        `
        <p
            style="
                color:var(--text-muted);
                margin-bottom:20px;
            "
        >
            اختر مصدر الفيديو
        </p>
        `;


    container.appendChild(
        heading
    );


    // ---------------------------------------------
    // Buttons
    // ---------------------------------------------

    const buttons =
        document.createElement(
            "div"
        );


    buttons.style.cssText =
        `
        display:flex;
        justify-content:center;
        flex-wrap:wrap;
        gap:12px;
        margin-bottom:25px;
        `;


    if (video.pcloud) {

        buttons.appendChild(
            createVideoSourceButton(
                "pCloud",
                "fas fa-cloud",
                video.pcloud,
                "pcloud"
            )
        );

    }


    if (video.drive) {

        buttons.appendChild(
            createVideoSourceButton(
                "Google Drive",
                "fab fa-google-drive",
                video.drive,
                "drive"
            )
        );

    }


    if (video.mega) {

        buttons.appendChild(
            createVideoSourceButton(
                "MEGA",
                "fas fa-cloud",
                video.mega,
                "mega"
            )
        );

    }


    container.appendChild(
        buttons
    );


    // ---------------------------------------------
    // Player
    // ---------------------------------------------

    const player =
        document.createElement(
            "div"
        );


    player.id =
        "homeworkVideoContainer";


    player.style.cssText =
        `
        width:100%;
        min-height:500px;
        border-radius:15px;
        overflow:hidden;
        background:#000;
        `;


    player.innerHTML =
        `
        <div
            style="
                min-height:500px;
                display:flex;
                justify-content:center;
                align-items:center;
                color:white;
                text-align:center;
                padding:30px;
            "
        >

            <div>

                <i
                    class="fas fa-play-circle"
                    style="
                        font-size:70px;
                        margin-bottom:20px;
                    "
                ></i>

                <h3>
                    اختر مصدر الفيديو بالأعلى
                </h3>

            </div>

        </div>
        `;


    container.appendChild(
        player
    );


    wrapper.appendChild(
        container
    );


    section.style.display =
        "block";


    hideHomeworkList();


    section.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });

}



/* =========================================================
   VIDEO SOURCE BUTTON
   ========================================================= */

function createVideoSourceButton(
    name,
    icon,
    url,
    type
) {

    const button =
        document.createElement(
            "button"
        );


    button.type =
        "button";


    button.className =
        "btn btn-primary";


    button.innerHTML =
        `
        <i class="${icon}"></i>
        ${name}
        `;


    button.addEventListener(
        "click",
        function () {

            loadVideoSource(
                url,
                type
            );

        }
    );


    return button;

}



/* =========================================================
   LOAD VIDEO SOURCE
   ========================================================= */

function loadVideoSource(
    url,
    type
) {

    const container =
        document.getElementById(
            "homeworkVideoContainer"
        );


    if (!container || !url) {

        return;

    }


    const safeUrl =
        cleanUrl(url);


    if (!safeUrl) {

        return;

    }


    /*
     * Google Drive
     */

    if (
        type === "drive" ||
        safeUrl.includes(
            "drive.google.com"
        )
    ) {

        const embedUrl =
            convertGoogleDriveUrl(
                safeUrl
            );


        if (embedUrl) {

            container.innerHTML =
                `
                <iframe
                    src="${escapeAttribute(embedUrl)}"
                    style="
                        width:100%;
                        height:600px;
                        border:0;
                        display:block;
                    "
                    allow="
                        autoplay;
                        fullscreen
                    "
                    allowfullscreen
                ></iframe>
                `;


            return;

        }

    }


    /*
     * pCloud / MEGA
     *
     * These services may block iframe embedding.
     *
     * Try iframe first.
     */

    container.innerHTML =
        `
        <iframe
            src="${escapeAttribute(safeUrl)}"
            style="
                width:100%;
                height:600px;
                border:0;
                display:block;
                background:#000;
            "
            allow="
                autoplay;
                fullscreen;
                encrypted-media
            "
            allowfullscreen
        ></iframe>

        <div
            style="
                text-align:center;
                padding:15px;
                background:#111;
                color:white;
            "
        >

            <a
                href="${escapeAttribute(safeUrl)}"
                target="_blank"
                rel="noopener noreferrer"
                style="color:white;"
            >
                إذا لم يعمل الفيديو،
                اضغط هنا لفتحه مباشرة
            </a>

        </div>
        `;

}



/* =========================================================
   GOOGLE DRIVE URL CONVERTER
   ========================================================= */

function convertGoogleDriveUrl(
    url
) {

    /*
     * Example:
     *
     * https://drive.google.com/file/d/FILE_ID/view
     *
     * becomes:
     *
     * https://drive.google.com/file/d/FILE_ID/preview
     */


    const match =
        url.match(
            /\/file\/d\/([^/]+)/
        );


    if (match && match[1]) {

        return (
            "https://drive.google.com/file/d/" +
            match[1] +
            "/preview"
        );

    }


    /*
     * Alternative Drive URL
     */

    const idMatch =
        url.match(
            /[?&]id=([^&]+)/
        );


    if (
        idMatch &&
        idMatch[1]
    ) {

        return (
            "https://drive.google.com/file/d/" +
            idMatch[1] +
            "/preview"
        );

    }


    return url;

}



/* =========================================================
   CLOSE VIDEO PLAYER
   ========================================================= */

function closeVideoPlayer() {

    const section =
        document.getElementById(
            "videoPlayerSection"
        );


    const wrapper =
        document.getElementById(
            "videoWrapper"
        );


    if (wrapper) {

        wrapper.innerHTML = "";

    }


    if (section) {

        section.style.display =
            "none";

    }


    showHomeworkList();

}



/* =========================================================
   SHOW / HIDE HOMEWORK
   ========================================================= */

function hideHomeworkList() {

    const section =
        document.getElementById(
            "homeworkList"
        );


    if (section) {

        section.style.display =
            "none";

    }

}



function showHomeworkList() {

    const section =
        document.getElementById(
            "homeworkList"
        );


    if (section) {

        section.style.display =
            "block";

    }

}



/* =========================================================
   AUTO LOAD MESSAGE
   ========================================================= */

function setAutoLoadMessage(
    message
) {

    const element =
        document.getElementById(
            "autoLoadMsg"
        );


    if (element) {

        element.textContent =
            message;

    }

}



/* =========================================================
   SHOW ELEMENT
   ========================================================= */

function showElement(
    id,
    show
) {

    const element =
        document.getElementById(
            id
        );


    if (!element) {

        return;

    }


    element.style.display =
        show ? "block" : "none";

}



/* =========================================================
   ALERT
   ========================================================= */

function showAlert(
    message,
    type = "error"
) {

    const alert =
        document.getElementById(
            "hwAlert"
        );


    if (!alert) {

        return;

    }


    alert.innerHTML =
        `
        <div
            style="
                padding:12px 16px;
                border-radius:10px;
                background:rgba(255,0,0,.08);
                color:var(--text);
            "
        >
            ${escapeHtml(message)}
        </div>
        `;

}



/* =========================================================
   HOMEWORK ERROR
   ========================================================= */

function showHomeworkError(
    message
) {

    showElement(
        "autoLoadCard",
        false
    );


    showElement(
        "homeworkList",
        true
    );


    const grid =
        document.getElementById(
            "homeworkGrid"
        );


    if (!grid) {

        return;

    }


    grid.innerHTML =
        `
        <div
            style="
                width:100%;
                text-align:center;
                padding:50px 20px;
            "
        >

            <i
                class="fas fa-exclamation-triangle"
                style="
                    font-size:50px;
                    margin-bottom:20px;
                "
            ></i>


            <h3>
                حدث خطأ أثناء تحميل الواجبات
            </h3>


            <p
                style="
                    color:var(--text-muted);
                    margin:12px 0 20px;
                "
            >
                ${escapeHtml(message)}
            </p>


            <button
                class="btn btn-primary"
                onclick="location.reload()"
            >

                <i class="fas fa-redo"></i>

                إعادة المحاولة

            </button>

        </div>
        `;

}



/* =========================================================
   URL CLEANER
   ========================================================= */

function cleanUrl(
    value
) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }


    return String(
        value
    ).trim();

}



/* =========================================================
   HTML ESCAPE
   ========================================================= */

function escapeHtml(
    value
) {

    return String(
        value ?? ""
    )
    .replace(
        /&/g,
        "&amp;"
    )
    .replace(
        /</g,
        "&lt;"
    )
    .replace(
        />/g,
        "&gt;"
    )
    .replace(
        /"/g,
        "&quot;"
    )
    .replace(
        /'/g,
        "&#039;"
    );

}



function escapeAttribute(
    value
) {

    return escapeHtml(
        value
    );

}



/* =========================================================
   DEBUG HELPERS
   ========================================================= */

window.homeworkDebug = {

    getStudent:
        function () {
            return currentStudent;
        },

    getHomework:
        function () {
            return allHomework;
        },

    getVideos:
        function () {
            return allLessonVideos;
        },

    reload:
        function () {
            autoLoadHomework();
        }

};
