// d:\Code\ClinicVIP\public\js\main.js
$(document).ready(function() {
    
    // 1. Hero Banner Slider
    if ($('.hero-slider').length) {
        $('.hero-slider').slick({
            autoplay: true,
            autoplaySpeed: 5000,
            dots: true,
            arrows: false,
            fade: true,
            cssEase: 'linear',
            pauseOnHover: false
        });
    }

    // 2. Packages Slider
    if ($('.packages-slider').length) {
        $('.packages-slider').slick({
            slidesToShow: 3,
            slidesToScroll: 1,
            dots: true,
            arrows: true,
            infinite: true,
            prevArrow: '<button type="button" class="slick-nav-btn slick-prev" aria-label="Trước"><i class="fas fa-chevron-left"></i></button>',
            nextArrow: '<button type="button" class="slick-nav-btn slick-next" aria-label="Sau"><i class="fas fa-chevron-right"></i></button>',
            responsive: [
                {
                    breakpoint: 992,
                    settings: {
                        slidesToShow: 2,
                        arrows: true
                    }
                },
                {
                    breakpoint: 768,
                    settings: {
                        slidesToShow: 1,
                        arrows: true
                    }
                }
            ]
        });
    }

    // 3. Specialties Slider
    if ($('.specialties-slider').length) {
        $('.specialties-slider').slick({
            slidesToShow: 3,
            slidesToScroll: 1,
            dots: true,
            arrows: true,
            infinite: true,
            prevArrow: '<button type="button" class="slick-nav-btn slick-prev" aria-label="Trước"><i class="fas fa-chevron-left"></i></button>',
            nextArrow: '<button type="button" class="slick-nav-btn slick-next" aria-label="Sau"><i class="fas fa-chevron-right"></i></button>',
            responsive: [
                {
                    breakpoint: 992,
                    settings: {
                        slidesToShow: 2,
                        arrows: true
                    }
                },
                {
                    breakpoint: 768,
                    settings: {
                        slidesToShow: 1,
                        arrows: true
                    }
                }
            ]
        });
    }

    // 4. Doctors Slider
    if ($('.doctors-slider').length) {
        $('.doctors-slider').slick({
            slidesToShow: 4,
            slidesToScroll: 1,
            dots: true,
            arrows: true,
            infinite: true,
            prevArrow: '<button type="button" class="slick-nav-btn slick-prev" aria-label="Trước"><i class="fas fa-chevron-left"></i></button>',
            nextArrow: '<button type="button" class="slick-nav-btn slick-next" aria-label="Sau"><i class="fas fa-chevron-right"></i></button>',
            responsive: [
                {
                    breakpoint: 1200,
                    settings: {
                        slidesToShow: 3,
                        arrows: true
                    }
                },
                {
                    breakpoint: 992,
                    settings: {
                        slidesToShow: 2,
                        arrows: true
                    }
                },
                {
                    breakpoint: 768,
                    settings: {
                        slidesToShow: 1,
                        arrows: true
                    }
                }
            ]
        });
    }

    // 5. News Slider
    if ($('.news-slider').length) {
        $('.news-slider').slick({
            slidesToShow: 3,
            slidesToScroll: 1,
            dots: true,
            arrows: true,
            infinite: true,
            prevArrow: '<button type="button" class="slick-nav-btn slick-prev" aria-label="Trước"><i class="fas fa-chevron-left"></i></button>',
            nextArrow: '<button type="button" class="slick-nav-btn slick-next" aria-label="Sau"><i class="fas fa-chevron-right"></i></button>',
            responsive: [
                {
                    breakpoint: 992,
                    settings: {
                        slidesToShow: 2,
                        arrows: true
                    }
                },
                {
                    breakpoint: 768,
                    settings: {
                        slidesToShow: 1,
                        arrows: true
                    }
                }
            ]
        });
    }

    // 5. Mobile Drawer Toggle
    $('#mobileToggle, .mobile-toggle, .hamburger').on('click', function() {
        $('#mobileDrawer, .mobile-drawer').addClass('open');
        $('body').css('overflow', 'hidden');
    });

    $('#drawerClose, .drawer-close, #drawerOverlay, .drawer-overlay, .drawer-nav a, .drawer-cta a').on('click', function() {
        $('#mobileDrawer, .mobile-drawer').removeClass('open');
        $('body').css('overflow', '');
    });

    // 6. Back to Top Button
    var $backToTop = $('#backToTop, #back-to-top, .back-to-top');
    $(window).on('scroll', function() {
        if ($(window).scrollTop() > 300) {
            $backToTop.addClass('visible show');
        } else {
            $backToTop.removeClass('visible show');
        }
    });

    $backToTop.on('click', function(e) {
        e.preventDefault();
        $('html, body').animate({scrollTop: 0}, 500);
        return false;
    });

    // 7. Doctor Filter Tabs
    $('.filter-tab').on('click', function() {
        $('.filter-tab').removeClass('active');
        $(this).addClass('active');
        var filter = $(this).data('filter');
        if (filter === 'all' || !filter) {
            $('.doctor-card-full').fadeIn(300);
        } else {
            $('.doctor-card-full').each(function() {
                if ($(this).data('specialty') == filter) {
                    $(this).fadeIn(300);
                } else {
                    $(this).fadeOut(200);
                }
            });
        }
    });

    // 8. Smooth Scroll to Anchor
    $('a[href^="#"]:not([href="#"])').on('click', function(e) {
        var target = $(this.hash);
        if (target.length) {
            e.preventDefault();
            var offset = 100;
            $('html, body').animate({
                scrollTop: target.offset().top - offset
            }, 600);
            
            // Close mobile menu if open
            $('#mobileDrawer, .mobile-drawer').removeClass('open');
            $('body').css('overflow', '');
        }
    });

    // 9. AOS Init (Animate On Scroll)
    if (typeof AOS !== 'undefined') {
        AOS.init({
            duration: 700,
            easing: 'ease-in-out',
            once: true,
            offset: 80
        });
    }

    // 10. Flash Message Auto-hide
    if ($('.alert').length) {
        setTimeout(function() {
            $('.alert').fadeOut(500);
        }, 5000);
    }

    // 11. Active Menu Item Highlight
    var currentPath = window.location.pathname;
    $('.nav-link').each(function() {
        var href = $(this).attr('href');
        if (currentPath === href || (href !== '/' && currentPath.startsWith(href))) {
            $(this).addClass('active');
        }
    });

    // 12. DateTime Picker Modal Logic (Hoan My Style)
    function initDateTimePicker() {
        var $modal = $('#datetimeModal');
        var $trigger = $('#openDatetimeModal');
        var $datesContainer = $('#modalDatesGrid');
        var $timeSlots = $('.time-slot-btn');
        var $btnConfirm = $('#btnConfirmDateTime');
        var $inputDate = $('#appointment_date');
        var $inputTime = $('#appointment_time');
        var $displayText = $('#selectedDateTimeText');

        if (!$modal.length || !$trigger.length) return;

        // Generate next 28 days
        var daysOfWeek = ['CN', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
        var today = new Date();
        var datesHtml = '';

        for (var i = 0; i < 24; i++) {
            var d = new Date();
            d.setDate(today.getDate() + i);

            var dayName = (i === 0) ? 'Hôm nay' : daysOfWeek[d.getDay()];
            var dateNum = (d.getDate() < 10 ? '0' : '') + d.getDate();
            var monthNum = ((d.getMonth() + 1) < 10 ? '0' : '') + (d.getMonth() + 1);
            var yearNum = d.getFullYear();

            var isoDate = yearNum + '-' + monthNum + '-' + dateNum;
            var displayDate = dateNum + '/' + monthNum;

            var activeClass = (i === 0) ? ' active' : '';

            datesHtml += '<button type="button" class="date-slot-btn' + activeClass + '" data-date="' + isoDate + '" data-display="' + dayName + ' ' + displayDate + '" data-full="' + dayName + ', ' + displayDate + '/' + yearNum + '">';
            datesHtml += '<span class="date-day-name">' + dayName + '</span>';
            datesHtml += '<span class="date-day-num">' + displayDate + '</span>';
            datesHtml += '</button>';
        }

        $datesContainer.html(datesHtml);

        var selectedDateIso = $('.date-slot-btn.active').data('date');
        var selectedDateFull = $('.date-slot-btn.active').data('full');
        var selectedTime = $('.time-slot-btn.active').data('time') || '08:30';

        // Pre-select default first time slot if none active
        $('.time-slot-btn').first().addClass('active');
        selectedTime = $('.time-slot-btn').first().data('time');

        // Open modal
        $trigger.on('click', function() {
            $modal.addClass('open');
            $('body').css('overflow', 'hidden');
        });

        // Close modal
        $('.dt-modal-close, .dt-modal-overlay').on('click', function() {
            $modal.removeClass('open');
            $('body').css('overflow', '');
        });

        // Date selection
        $(document).on('click', '.date-slot-btn', function() {
            $('.date-slot-btn').removeClass('active');
            $(this).addClass('active');
            selectedDateIso = $(this).data('date');
            selectedDateFull = $(this).data('full');
        });

        // Time selection
        $(document).on('click', '.time-slot-btn', function() {
            $('.time-slot-btn').removeClass('active');
            $(this).addClass('active');
            selectedTime = $(this).data('time');
        });

        // Confirm button
        $btnConfirm.on('click', function() {
            if (!selectedDateIso || !selectedTime) {
                alert('Vui lòng chọn ngày và giờ khám.');
                return;
            }
            $inputDate.val(selectedDateIso);
            $inputTime.val(selectedTime);
            $displayText.html('<strong>' + selectedDateFull + '</strong> lúc <strong>' + selectedTime + '</strong>').addClass('has-value');
            $trigger.addClass('selected');
            $modal.removeClass('open');
            $('body').css('overflow', '');
        });
    }

    initDateTimePicker();

    // 13. Auto-format Birthday Input (dd/MM/yyyy)
    $('#birthday').on('input', function() {
        var val = $(this).val().replace(/\D/g, '').slice(0, 8);
        if (val.length >= 5) {
            $(this).val(val.slice(0, 2) + '/' + val.slice(2, 4) + '/' + val.slice(4));
        } else if (val.length >= 3) {
            $(this).val(val.slice(0, 2) + '/' + val.slice(2));
        } else {
            $(this).val(val);
        }
    });

    // 14. Auto-dismiss Alert Notifications
    if ($('.alert').length) {
        setTimeout(function() {
            $('.alert').fadeOut(500, function() {
                $(this).remove();
            });
        }, 3500);
    }
});
