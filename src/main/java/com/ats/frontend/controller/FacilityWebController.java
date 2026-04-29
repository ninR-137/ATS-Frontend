package com.ats.frontend.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.ui.Model;

@Controller
@RequestMapping("/facilities")
public class FacilityWebController {

    @GetMapping({"", "/"})
    public String listPage() {
        return "facilities/list";
    }

    @GetMapping("/{facilityId}")
    public String detailPage(@PathVariable String facilityId, Model model) {
        model.addAttribute("facilityId", facilityId);
        return "facilities/detail";
    }

    @GetMapping("/create")
    public String createFacilityPage() {
        return "facilities/create";
    }

    @GetMapping("/add")
    public String addFacilityUserPage() {
        return "facilities/add";
    }

    @GetMapping("/{facilityId}/users")
    public String facilityUsersWorkspacePage(@PathVariable String facilityId, Model model) {
        model.addAttribute("facilityId", facilityId);
        return "facilities/users";
    }
}
