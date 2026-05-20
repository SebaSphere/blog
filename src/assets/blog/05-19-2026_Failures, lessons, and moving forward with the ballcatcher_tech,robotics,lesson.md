> ballholder, the machine built to hold balls :tm:

It’s been a rollercoaster of a semester. My ballcatcher is technically unfinished, courtesy of ongoing medical issues and neurodivergent traits I’ve been learning to work with, which I touched on in my last entry and will dive deeper into next time. Now that things are feeling much more manageable, I’m incredibly thankful to my professor for giving me an extension for the entire summer semester. In this post, I want to break down the technical challenges I faced, the lessons I've learned, and what's next for the build.

## Failures
I'd like to start with the last work I've done on the project so far. It's the last couple of days before the deadline, I'm going 100mph between studying for my Design and Analysis of Algorithms final and attempting to complete the project. It's been kind of a blur and some of the worst weeks I've had in my life, but I'm glad I've pushed through with the help of my friends around me.

It wasn't just balancing a brutal Algorithms final, which at the same time my house seemed to be falling apart. As I was starting work over the weekend, my landlord wanted me to turn off my AC for maintenance, which working without AC was a pain point making me irritable as it is but then to top it off, the plumbing completely breaks down. Instead of a swift resolution to an uninhabitable living situation, the pressure spiked into a tense confrontation when the landlord started yelling and aggressively attempting to pin the entire blame for the plumbing infrastructure issues on me and my roommates. (While we eventually came to a mutual understanding that things happen in peoples lives a few weeks later and settled the peace, at that exact moment, the friction was near a breaking point.)

After the tension sort of settled down, I called my cousin and asked him if I could head over to his house to change up my environment. Off from there, I drove down from South Miami to the Redlands, which I found to be a nice change of pace. While I was still running a billion miles a hour in my head talking myself off about the situation to my cousin, I had started setup on the project after I settled in and noticed a critical failure... The printed parts I had modeled were broken at the joints in several parts of the bot at the very last minute.

For the next few hours in a dazed state, I'd attempt to fix the bot with lots of duct tape and massively scale back to work what I do have that isn't broken.
![ball bot](https://i.imgur.com/WkuVpF7.jpeg)

## Stepping back
Into the rush to get a compromised, duct-taped mess of hopes and dreams, I was attempting to get the bot together and noticed for the motor that did work, one of the PUL+ wires were missing. Within my dash to get the project working, I guess I lost my tiny screwdriver so I didn't have the correct equipment to fix it. I brought spare wires and could have sworn I brought the tiny screwdriver, but I guess in my daze to get out my rental, I lost this.

From there, after talking back and forward with cousin, I made the decision to consider my two major options, a medical withdrawal or a incomplete grade on the class. Thankfully, after some back and forth with my professor on my options, I was able to get an incomplete grade with an extension till the end of the summer. Finally, I was able to get some sleep...

With the stressors of no longer worrying about a stressing deadline, I'd like to mention the positive instead of purely the gloom and doom.

I enjoyed talking with younger cousin, sister, and cousin who's place I was over, the support provided and talking about general life stuff as things started to slightly calm down was a nice change in pace.

Walking around the Redlands exurb was calming in a sense, I found it a different experience walking compared to the loudness of living in South Miami. I took a few pictures:
![chicken](https://i.imgur.com/kUcmc5r.jpeg)
![the fog](https://i.imgur.com/Suphx09.jpeg)

## What is done
Before even proceeding with the summer rebuild, it's worth looking at what is actually functional. Despite the setbacks, the core infrastructure of the bot is there and is ready to be worked on again.

- CI/CD pipeline: small pipeline so when I push code to GitHub, this automatically updates the code on my bot
- Yaw/Pitch controller joints: Abstracted out code so I only need to specify my exact pins to setup a stepper motor
- Homing system: Automatic homing system so the stepper motor keeps track of where it is on a 1D dimension
- Swagger UI: Debug endpoint to call off events like homing and such
- CAD design: I've made a base model for all parts that exists in Fusion 360, which needs edits for stability
- Components settled on: I've bought everything I'd need such as power delivery, stepper motors, and such
- Virtualized ball position recognition: While I'm sure I might run into some issues with lens distortion, I've been able to virtualize the core logic of ball recognition

Here are some random pictures in no particular order:
![meow grip](https://i.imgur.com/0lMarka.png)
> desperation visualized

---

![virtualized cameras](https://i.imgur.com/FAUZfhG.png)
> virtualized dual-camera virtualized positioning (note: this isn't live but off a static file for testing)

---

![god forsaken craft](https://i.imgur.com/pBSE3Uc.png)
> old prototype before the 270-degree redesign and slip ring mishaps

## Lessons
Stepping back from the immediate chaos for the deadline and nature of the class reveals the main engineering challenges I'll need to keep into consideration for this project and future
- Treat modularity with the utmost respect, making parts into their smaller parts rather than in one. 
- Trust intuition on the slow engineering process before jumping into a new feature for the sake of deadlines
- Respect material limits, designing my parts for a high load with features such as reinforced rebar as needed.

## What's next
With the Summer extension, I have till August 1st when the semester ends (although I'm sure my teacher might want this sooner). This may be ambitious but I'm looking to get the following in the next 5 weeks so I have plenty of time should things fall apart.

**Chassis redesign**: I am looking to make my parts boltable through screws and rods. This may include the following
- Metal rebar rod in my limiter for the rotational bit to keep it stable
- Screwable sections for my stepper motor placement, solid camera mount, funnel, and stepper motor bits
- Test rigs for my testable parts such as cameras, I need reliance before putting on the bot
- No relying on hot glue to hold my parts
- Wire guiders so the bot rotates without wires catching

**Camera recognition**: I want to move my virtualized code to real life. I'll need to tackle
- Camera distortion, there's some matrix stuff I'd need to do to normalize the fisheye effect of a lens
- Live positioning, I'll need to hook recognition up to a tick system and hold the entry in a database
- Dynamic coordinate transformation, as the bot rotates on the yaw I'll need to move the position that the ball is guesstimated to be as the reference position changes

**Ball catching**: As the ball moves, I'll need to move the funnel to match with the balls position
- Dynamic plane virtualization, I'll need to get the exact plane the funnel is and estimate a best path for the ball
- Trajectory Intersection, I will need to collect dozens of data points to calculate the balls projected 3D parabolic flight path.
- Predictive pathing, instead of changing the balls current position, we'd ideally want to calculate the optimal path before the ball lands in the funnel

## Ending
This semester was definitely one with ups and downs, I'm thankful for the lessons I've learned and excited to work on this project again with the new lessons in mind.

The original goal for the project was a bot that can catch a ball and throw it back, which is now scoped out until I have strong fundamentals. That vision hasn't changed but before proceeding, good engineering requires a base point before adding on features, working from the ground up on the abstract details.

For my 5 week sprint, I'm planning on scoping back without the launch functionality and I'll be completely ignoring it for my own focus. It is, of course, something I can swap out later with a new 3D printed part but I'll be ignoring this now.

Thanks for reading.