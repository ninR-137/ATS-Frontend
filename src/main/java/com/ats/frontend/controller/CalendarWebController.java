package com.ats.frontend.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/calendar")
public class CalendarWebController {

    @GetMapping({"", "/"})
    public String calendarPage() {
        return "calendar/index";
    }
}
