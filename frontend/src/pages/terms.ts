export function renderTerms(app: HTMLElement) {
    app.innerHTML = `
    <div id="page-terms" class="
        grid place-items-center p-[1rem]

        sp:min-h-[calc(100vh-4rem)]
        st:min-h-[100vh]
        sc:min-h-[calc(100vh-4rem)]

        animate-page-in
    ">

        <section class="
            w-[min(48rem,100%)]
            card rounded-[2rem]
            backdrop-blur-xl bg-[#FFF]/10
            border-[#FFF]/25 border-[0.125rem]
            p-[1.5rem]
            flex flex-col gap-[1.5rem]
        ">
            <h1 class="title text-center">Terms of Service</h1>
            <p><strong>Last updated:</strong> 12 12 2025</p>

            <p>
                These Terms of Service (“Terms”) govern your access to and use of our web application 
                Transcendance (the “Service”). By creating an account or using the Service, you agree to 
                comply with these Terms. If you do not agree, you must not use the Service.
            </p>

            <h2 class="soft-title mt-[1rem]">TABLE OF CONTENTS</h2>
            <ul class="list-disc ml-6 space-y-1">
                <li>1. ELIGIBILITY</li>
                <li>2. ACCOUNT REGISTRATION & SECURITY</li>
                <li>3. USER CONDUCT</li>
                <li>4. GAMEPLAY & REAL-TIME FEATURES</li>
                <li>5. USER-GENERATED CONTENT</li>
                <li>6. INTELLECTUAL PROPERTY</li>
                <li>7. SERVICE AVAILABILITY</li>
                <li>8. DISCLAIMER OF WARRANTIES</li>
                <li>9. LIMITATION OF LIABILITY</li>
                <li>10. TERMINATION</li>
                <li>11. CHANGES TO THE TERMS</li>
                <li>12. CONTACT</li>
            </ul>

            <h2 class="soft-title mt-[1rem]">1. Eligibility</h2>
            <p>
                By using the Service, you confirm that you meet the minimum legal age required in your country 
                to create an online account. Individuals under this age are not permitted to use the Service.
            </p>

            <h2 class="soft-title mt-[1rem]">2. Account Registration & Security</h2>
            <p>
                To access certain features of the Service, you must create an account and provide accurate 
                information, including a valid email, username, and password.
            </p>
            <ul class="list-disc ml-6 space-y-1">
                <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
                <li>You must notify us immediately of any unauthorized use of your account.</li>
                <li>We may suspend or delete accounts that violate these Terms.</li>
            </ul>

            <h2 class="soft-title mt-[1rem]">3. User Conduct</h2>
            <p>
                You agree not to engage in conduct that harms the Service or other users, including:
            </p>
            <ul class="list-disc ml-6 space-y-1">
                <li>Harassment, threats, or abusive behavior.</li>
                <li>Cheating, exploiting bugs, or using unauthorized software.</li>
                <li>Attempting to access or modify data without permission.</li>
                <li>Uploading harmful content such as malware.</li>
            </ul>

            <p>
                We reserve the right to restrict or suspend accounts that violate these rules.
            </p>

            <h2 class="soft-title mt-[1rem]">4. Gameplay & Real-Time Features</h2>
            <p>
                The Service includes multiplayer matches, matchmaking, chat, friend lists, and spectator mode.  
                By using these features, you understand and agree that:
            </p>
            <ul class="list-disc ml-6 space-y-1">
                <li>Your username, profile, online status, and game statistics may be visible to other users.</li>
                <li>Real-time features rely on network connectivity and may experience delays or disruptions.</li>
                <li>We may collect technical data to provide these features (see Privacy Policy).</li>
            </ul>

            <h2 class="soft-title mt-[1rem]">5. User-Generated Content</h2>
            <p>
                “User-generated content” includes chat messages, usernames, avatars, and any material you submit 
                through the Service.
            </p>
            <ul class="list-disc ml-6 space-y-1">
                <li>You retain ownership of your content.</li>
                <li>You grant us permission to store, transmit, and display it as needed for the Service.</li>
                <li>You agree not to submit illegal, harmful, or abusive content.</li>
            </ul>

            <h2 class="soft-title mt-[1rem]">6. Intellectual Property</h2>
            <p>
                All code, design, graphics, and features within the Service are protected and remain the 
                property of the project creators. You may not copy, modify, distribute, or reverse-engineer 
                any part of the Service.
            </p>

            <h2 class="soft-title mt-[1rem]">7. Service Availability</h2>
            <p>
                We aim to maintain the Service in good working order, but:
            </p>
            <ul class="list-disc ml-6 space-y-1">
                <li>We do not guarantee continuous availability of servers.</li>
                <li>Features may be added, modified, or removed at any time.</li>
                <li>Maintenance or outages may occur without notice.</li>
            </ul>

            <h2 class="soft-title mt-[1rem]">8. Disclaimer of Warranties</h2>
            <p>
                The Service is provided “as is” and “as available” without warranties of any kind, whether 
                express or implied. We do not guarantee that:
            </p>
            <ul class="list-disc ml-6 space-y-1">
                <li>The Service will be error-free or uninterrupted.</li>
                <li>Real-time features will work at all times.</li>
                <li>Data will always be stored or backed up.</li>
            </ul>

            <h2 class="soft-title mt-[1rem]">9. Limitation of Liability</h2>
            <p>
                To the fullest extent permitted by law, we are not liable for:
            </p>
            <ul class="list-disc ml-6 space-y-1">
                <li>Loss of data</li>
                <li>Connection issues or interruptions</li>
                <li>Malicious actions from other users</li>
                <li>Damages arising from the use or inability to use the Service</li>
            </ul>

            <h2 class="soft-title mt-[1rem]">10. Termination</h2>
            <p>
                We may suspend or terminate your access to the Service if you violate these Terms or engage in 
                harmful behavior. You may also delete your account at any time.
            </p>

            <h2 class="soft-title mt-[1rem]">11. Changes to the Terms</h2>
            <p>
                We may update these Terms periodically. Continued use of the Service after changes means you 
                accept the updated Terms.
            </p>

            <h2 class="soft-title mt-[1rem]">12. Contact</h2>
            <p>
                If you have questions about these Terms, you can contact us at:<br/>
                Location: <strong>42 Mulhouse</strong><br/>
                Email: <strong>epasseri@student.42mulhouse.fr</strong><br/>
            </p>
        </section>

    </div>`;
}
